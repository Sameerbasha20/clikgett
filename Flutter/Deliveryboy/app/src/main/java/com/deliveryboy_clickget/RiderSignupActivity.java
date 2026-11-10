package com.deliveryboy_clickget;

import android.app.ProgressDialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Base64;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;
import androidx.exifinterface.media.ExifInterface;

import com.deliveryboy_clickget.Utils.CommonUtilities;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * "Become a delivery partner": name, mobile (OTP-verified), selfie, Aadhaar, driving licence,
 * bike or auto. Sent to /rider-signup/apply; an admin approves it in admin > Rider applications,
 * which creates the rider login.
 */
public class RiderSignupActivity extends AppCompatActivity {

    private static final int MAX_SIDE = 1600;     // photos are shrunk before upload
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private TextInputLayout nameLayout, mobileLayout, otpLayout;
    private TextInputEditText nameEdt, mobileEdt, otpEdt;
    private MaterialButton sendOtpBtn, submitBtn;
    private MaterialCardView bikeCard, autoCard;
    private TextView vehicleError;
    private final PhotoSlot selfie = new PhotoSlot("selfie", "Selfie", "Clear face, no cap or sunglasses", true);
    private final PhotoSlot aadhaar = new PhotoSlot("aadhaar", "Aadhaar card", "Front side, all 4 corners visible", false);
    private final PhotoSlot licence = new PhotoSlot("licence", "Driving licence", "Name and photo must be readable", false);
    private String vehicle = null;
    private boolean otpSent = false;

    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS).readTimeout(60, TimeUnit.SECONDS).writeTimeout(60, TimeUnit.SECONDS).build();

    private PhotoSlot pending;           // slot waiting for a camera / gallery result
    private Uri pendingCameraUri;
    private ActivityResultLauncher<Uri> takePicture;
    private ActivityResultLauncher<String> pickImage;

    /** One photo (selfie, Aadhaar, licence): its tile and the compressed JPEG. */
    private class PhotoSlot {
        final String key, title, hint;
        final boolean cameraOnly;
        View root;
        ImageView preview;
        TextView action, error;
        MaterialCardView card;
        String base64;

        PhotoSlot(String key, String title, String hint, boolean cameraOnly) {
            this.key = key; this.title = title; this.hint = hint; this.cameraOnly = cameraOnly;
        }

        void bind(View tile) {
            root = tile;
            card = tile.findViewById(R.id.photo_card);
            preview = tile.findViewById(R.id.photo_preview);
            action = tile.findViewById(R.id.photo_action);
            error = tile.findViewById(R.id.photo_error);
            ((TextView) tile.findViewById(R.id.photo_title)).setText(title);
            ((TextView) tile.findViewById(R.id.photo_hint)).setText(hint);
            action.setText(cameraOnly ? "📷 Take" : "Add");
            card.setOnClickListener(v -> choose(this));
        }

        void setError(String message) {
            error.setText(message);
            error.setVisibility(message == null ? View.GONE : View.VISIBLE);
            card.setStrokeColor(ContextCompat.getColor(RiderSignupActivity.this,
                    message == null ? (base64 != null ? R.color.clikgett_green_primary : R.color.clikgett_card_stroke) : R.color.color_danger));
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getSupportActionBar() != null) getSupportActionBar().hide();
        setContentView(R.layout.activity_rider_signup);

        nameLayout = findViewById(R.id.name_layout);
        mobileLayout = findViewById(R.id.mobile_layout);
        otpLayout = findViewById(R.id.otp_layout);
        nameEdt = findViewById(R.id.name_edt);
        mobileEdt = findViewById(R.id.mobile_edt);
        otpEdt = findViewById(R.id.otp_edt);
        sendOtpBtn = findViewById(R.id.send_otp_btn);
        submitBtn = findViewById(R.id.submit_btn);
        bikeCard = findViewById(R.id.vehicle_bike);
        autoCard = findViewById(R.id.vehicle_auto);
        vehicleError = findViewById(R.id.vehicle_error);
        selfie.bind(findViewById(R.id.selfie_tile));
        aadhaar.bind(findViewById(R.id.aadhaar_tile));
        licence.bind(findViewById(R.id.licence_tile));

        findViewById(R.id.signup_back).setOnClickListener(v -> finish());
        clearErrorOnType(nameEdt, nameLayout);
        clearErrorOnType(mobileEdt, mobileLayout);
        clearErrorOnType(otpEdt, otpLayout);
        // A new number needs a new OTP.
        mobileEdt.addTextChangedListener(new SimpleWatcher(() -> {
            if (otpSent) { otpSent = false; otpLayout.setVisibility(View.GONE); otpEdt.setText(""); sendOtpBtn.setText("Send OTP"); }
        }));
        bikeCard.setOnClickListener(v -> chooseVehicle("bike"));
        autoCard.setOnClickListener(v -> chooseVehicle("auto"));
        sendOtpBtn.setOnClickListener(v -> sendOtp());
        submitBtn.setOnClickListener(v -> submit());

        takePicture = registerForActivityResult(new ActivityResultContracts.TakePicture(), ok -> {
            if (ok && pending != null && pendingCameraUri != null) loadPhoto(pending, pendingCameraUri);
        });
        pickImage = registerForActivityResult(new ActivityResultContracts.GetContent(), uri -> {
            if (uri != null && pending != null) loadPhoto(pending, uri);
        });
    }

    @Override
    protected void onDestroy() {
        io.shutdownNow();
        super.onDestroy();
    }

    // ---------------------------------------------------------------- validation (same rules as the server)

    private static String nameError(String s) {
        if (s.isEmpty()) return "Please enter your full name";
        if (s.matches(".*\\d.*")) return "Name cannot contain numbers";
        if (s.length() < 2) return "Name is too short";
        if (!s.matches("[A-Za-z][A-Za-z .']{1,59}")) return "Name can only have letters and spaces";
        return null;
    }

    private static String mobileError(String s) {
        if (s.isEmpty()) return "Please enter your mobile number";
        if (!s.matches("\\d*")) return "Mobile number can only have digits";
        if (s.length() != 10) return "Mobile number must be 10 digits";
        if (!s.matches("[6-9]\\d{9}")) return "Mobile number must start with 6, 7, 8 or 9";
        return null;
    }

    private String text(TextInputEditText e) {
        return e.getText() == null ? "" : e.getText().toString().trim().replaceAll("\\s+", " ");
    }

    private void clearErrorOnType(TextInputEditText e, TextInputLayout l) {
        e.addTextChangedListener(new SimpleWatcher(() -> l.setError(null)));
    }

    // ---------------------------------------------------------------- vehicle

    private void chooseVehicle(String v) {
        vehicle = v;
        styleVehicle(bikeCard, "bike".equals(v));
        styleVehicle(autoCard, "auto".equals(v));
        vehicleError.setVisibility(View.GONE);
    }

    private void styleVehicle(MaterialCardView card, boolean selected) {
        card.setStrokeWidth(dp(selected ? 2 : 1));
        card.setStrokeColor(ContextCompat.getColor(this, selected ? R.color.clikgett_green_primary : R.color.clikgett_card_stroke));
        card.setCardBackgroundColor(ContextCompat.getColor(this, selected ? R.color.clikgett_green_light : R.color.clikgett_card_surface));
    }

    private int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    // ---------------------------------------------------------------- photos

    private void choose(PhotoSlot slot) {
        pending = slot;
        if (slot.cameraOnly) { openCamera(); return; }
        new AlertDialog.Builder(this)
                .setTitle(slot.title)
                .setItems(new CharSequence[]{"📷  Take a photo", "🖼  Choose from gallery"}, (d, which) -> {
                    if (which == 0) openCamera(); else pickImage.launch("image/*");
                })
                .show();
    }

    private void openCamera() {
        try {
            File dir = new File(getFilesDir(), "signup");
            if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("no folder");
            File file = new File(dir, pending.key + "_" + System.currentTimeMillis() + ".jpg");
            pendingCameraUri = FileProvider.getUriForFile(this, "com.deliveryboy_clickget.provider", file);
            takePicture.launch(pendingCameraUri);
        } catch (Exception e) {
            Toast.makeText(this, "Could not open the camera", Toast.LENGTH_LONG).show();
        }
    }

    /** Decodes, rotates upright, shrinks to MAX_SIDE and compresses to JPEG, off the main thread. */
    private void loadPhoto(PhotoSlot slot, Uri uri) {
        slot.action.setText("…");
        io.execute(() -> {
            try {
                BitmapFactory.Options bounds = new BitmapFactory.Options();
                bounds.inJustDecodeBounds = true;
                try (InputStream in = getContentResolver().openInputStream(uri)) { BitmapFactory.decodeStream(in, null, bounds); }
                if (bounds.outWidth <= 0) throw new IllegalArgumentException("not an image");
                int sample = 1;
                while (Math.max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= MAX_SIDE) sample *= 2;
                BitmapFactory.Options opts = new BitmapFactory.Options();
                opts.inSampleSize = sample;
                Bitmap bmp;
                try (InputStream in = getContentResolver().openInputStream(uri)) { bmp = BitmapFactory.decodeStream(in, null, opts); }
                if (bmp == null) throw new IllegalArgumentException("not an image");
                int rotate = 0;
                try (InputStream in = getContentResolver().openInputStream(uri)) {
                    int o = new ExifInterface(in).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                    rotate = o == ExifInterface.ORIENTATION_ROTATE_90 ? 90 : o == ExifInterface.ORIENTATION_ROTATE_180 ? 180 : o == ExifInterface.ORIENTATION_ROTATE_270 ? 270 : 0;
                } catch (Exception ignored) { }
                float scale = Math.min(1f, (float) MAX_SIDE / Math.max(bmp.getWidth(), bmp.getHeight()));
                Matrix m = new Matrix();
                m.postScale(scale, scale);
                m.postRotate(rotate);
                Bitmap out = Bitmap.createBitmap(bmp, 0, 0, bmp.getWidth(), bmp.getHeight(), m, true);
                if (Math.min(out.getWidth(), out.getHeight()) < 300) throw new IllegalArgumentException("small");
                ByteArrayOutputStream buf = new ByteArrayOutputStream();
                out.compress(Bitmap.CompressFormat.JPEG, 82, buf);
                String b64 = "data:image/jpeg;base64," + Base64.encodeToString(buf.toByteArray(), Base64.NO_WRAP);
                main.post(() -> {
                    slot.base64 = b64;
                    slot.preview.setImageBitmap(out);
                    slot.action.setText("Change");
                    slot.setError(null);
                });
            } catch (Exception e) {
                String why = "small".equals(e.getMessage()) ? "This photo is too small. Please take a clearer one." : "Could not read this photo. Please try again.";
                main.post(() -> {
                    slot.action.setText(slot.base64 == null ? (slot.cameraOnly ? "📷 Take" : "Add") : "Change");
                    slot.setError(why);
                });
            }
        });
    }

    // ---------------------------------------------------------------- network

    private interface Done { void run(int code, JSONObject body); }

    private void post(String path, JSONObject body, Done done) {
        io.execute(() -> {
            int code = 0;
            JSONObject json = null;
            try {
                Request req = new Request.Builder().url(CommonUtilities.URL + path).post(RequestBody.create(body.toString(), JSON)).build();
                try (Response r = http.newCall(req).execute()) {
                    code = r.code();
                    String s = r.body() != null ? r.body().string() : "";
                    json = s.isEmpty() ? new JSONObject() : new JSONObject(s);
                }
            } catch (Exception ignored) { }
            final int c = code;
            final JSONObject j = json;
            main.post(() -> { if (!isFinishing()) done.run(c, j); });
        });
    }

    private void sendOtp() {
        String mobile = text(mobileEdt);
        String err = mobileError(mobile);
        if (err != null) { mobileLayout.setError(err); return; }
        sendOtpBtn.setEnabled(false);
        sendOtpBtn.setText("Sending…");
        try {
            post("rider-signup/sendotp", new JSONObject().put("MobileNumber", mobile), (code, body) -> {
                sendOtpBtn.setEnabled(true);
                if (body != null && body.optInt("Status") == 1) {
                    otpSent = true;
                    otpLayout.setVisibility(View.VISIBLE);
                    otpEdt.requestFocus();
                    sendOtpBtn.setText("Resend");
                    Toast.makeText(this, "OTP sent to " + mobile, Toast.LENGTH_SHORT).show();
                } else {
                    sendOtpBtn.setText(otpSent ? "Resend" : "Send OTP");
                    mobileLayout.setError(body != null ? body.optString("Message", "Could not send the OTP") : "No internet connection");
                }
            });
        } catch (Exception e) {
            sendOtpBtn.setEnabled(true);
        }
    }

    private void submit() {
        String name = text(nameEdt);
        String mobile = text(mobileEdt);
        String otp = text(otpEdt);
        View firstProblem = null;

        String e = nameError(name);
        nameLayout.setError(e);
        if (e != null) firstProblem = nameLayout;
        e = mobileError(mobile);
        mobileLayout.setError(e);
        if (e != null && firstProblem == null) firstProblem = mobileLayout;
        if (e == null && !otpSent) {
            mobileLayout.setError("Tap Send OTP to verify your number");
            if (firstProblem == null) firstProblem = mobileLayout;
        } else if (otpSent && !otp.matches("\\d{4,6}")) {
            otpLayout.setError(otp.isEmpty() ? "Enter the OTP sent to your number" : "OTP has only digits");
            if (firstProblem == null) firstProblem = otpLayout;
        }
        for (PhotoSlot s : new PhotoSlot[]{selfie, aadhaar, licence}) {
            s.setError(s.base64 == null ? "Please add your " + s.title.toLowerCase(java.util.Locale.ROOT) + " photo" : null);
            if (s.base64 == null && firstProblem == null) firstProblem = s.root;
        }
        if (vehicle == null) {
            vehicleError.setText("Choose bike or auto");
            vehicleError.setVisibility(View.VISIBLE);
            if (firstProblem == null) firstProblem = vehicleError;
        }
        if (firstProblem != null) {
            View target = firstProblem;
            findViewById(R.id.signup_scroll).post(() -> findViewById(R.id.signup_scroll).scrollTo(0, Math.max(0, target.getTop() - dp(60))));
            return;
        }

        ProgressDialog progress = new ProgressDialog(this);
        progress.setMessage("Uploading your documents…");
        progress.setCancelable(false);
        progress.show();
        try {
            JSONObject body = new JSONObject()
                    .put("FullName", name).put("MobileNumber", mobile).put("OTP", otp).put("VehicleType", vehicle)
                    .put("Selfie", selfie.base64).put("Aadhaar", aadhaar.base64).put("Licence", licence.base64);
            post("rider-signup/apply", body, (code, res) -> {
                try { progress.dismiss(); } catch (Exception ignored) { }
                if (res != null && res.optInt("Status") == 1) {
                    new AlertDialog.Builder(this)
                            .setTitle("🎉 Application submitted")
                            .setMessage(res.optString("Message", "We will verify your documents and call you soon.")
                                    + "\n\nOnce approved, log in with " + mobile + ".")
                            .setCancelable(false)
                            .setPositiveButton("OK", (d, w) -> finish())
                            .show();
                } else {
                    String msg = res != null ? res.optString("Message", "Could not submit. Please try again.") : "No internet connection. Please try again.";
                    if (msg.toLowerCase(java.util.Locale.ROOT).contains("otp") || msg.toLowerCase(java.util.Locale.ROOT).contains("code")) otpLayout.setError(msg);
                    else if (msg.toLowerCase(java.util.Locale.ROOT).contains("name")) nameLayout.setError(msg);
                    else Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
                }
            });
        } catch (Exception ex) {
            progress.dismiss();
        }
    }

    /** TextWatcher that only needs afterTextChanged. */
    private static class SimpleWatcher implements TextWatcher {
        private final Runnable after;
        SimpleWatcher(Runnable after) { this.after = after; }
        @Override public void beforeTextChanged(CharSequence s, int a, int b, int c) { }
        @Override public void onTextChanged(CharSequence s, int a, int b, int c) { }
        @Override public void afterTextChanged(Editable s) { after.run(); }
    }
}
