package com.deliveryboy_clickget;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.widget.Toast;
import android.widget.VideoView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.IOException;

public class VioVideo extends AppCompatActivity {
    private static final int PICK_VIDEO_REQUEST = 1;
    private static final int REQUEST_PERMISSIONS = 100;

    private VideoView videoView;
    private EditText editText;
    private TextView videoOverlayText;
    private FrameLayout frameLayout;
    private Uri videoUri;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_vio_video);

        videoView = findViewById(R.id.videoView);
        editText = findViewById(R.id.editText);
        videoOverlayText = findViewById(R.id.videoOverlayText);
        frameLayout = findViewById(R.id.frameLayout);
        Button buttonShare = findViewById(R.id.buttonShare);
        Button buttonSelectVideo = findViewById(R.id.buttonSelectVideo);

        buttonSelectVideo.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                selectVideo();
            }
        });

        buttonShare.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (arePermissionsGranted()) {
                    try {
                        shareVideoAndFrame();
                    } catch (IOException e) {
                        e.printStackTrace();
                    }
                } else {
                    ActivityCompat.requestPermissions(VioVideo.this, getRequiredPermissions(), REQUEST_PERMISSIONS);
                }
            }
        });
    }

    private boolean arePermissionsGranted() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) == PackageManager.PERMISSION_GRANTED;
        } else {
            return ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED;
        }
    }

    private String[] getRequiredPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return new String[]{
                    Manifest.permission.READ_MEDIA_VIDEO,
                    Manifest.permission.READ_MEDIA_IMAGES
            };
        } else {
            return new String[]{
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
            };
        }
    }

    private void selectVideo() {
        Intent intent = new Intent();
        intent.setType("video/*");
        intent.setAction(Intent.ACTION_GET_CONTENT);
        startActivityForResult(Intent.createChooser(intent, "Select Video"), PICK_VIDEO_REQUEST);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == PICK_VIDEO_REQUEST && resultCode == RESULT_OK && data != null && data.getData() != null) {
            videoUri = data.getData();
            videoView.setVideoURI(videoUri);
            videoView.start();
            videoOverlayText.setVisibility(View.VISIBLE);
            videoOverlayText.setText(editText.getText().toString());
        }
    }

    private void shareVideoAndFrame() throws IOException {
//        if (videoUri != null) {
//            // Save the frame layout as an image
//            File imageFile = new File(getExternalFilesDir(Environment.DIRECTORY_PICTURES), "frame_layout_image.png");
//            Bitmap frameLayoutBitmap = Bitmap.createBitmap(frameLayout.getWidth(), frameLayout.getHeight(), Bitmap.Config.ARGB_8888);
//            Canvas frameLayoutCanvas = new Canvas(frameLayoutBitmap);
//            Drawable background = frameLayout.getBackground();
//            if (background != null) {
//                background.draw(frameLayoutCanvas);
//            } else {
//                frameLayoutCanvas.drawColor(getResources().getColor(android.R.color.white));
//            }
//            frameLayout.draw(frameLayoutCanvas);
//            try (FileOutputStream fos = new FileOutputStream(imageFile)) {
//                frameLayoutBitmap.compress(Bitmap.CompressFormat.PNG, 100, fos);
//                fos.flush();
//            }
//
//            // Save the video file to the external files directory
//            File videoFile = new File(getExternalFilesDir(Environment.DIRECTORY_MOVIES), "shared_video.mp4");
//            try (InputStream inputStream = getContentResolver().openInputStream(videoUri);
//                 OutputStream outputStream = new FileOutputStream(videoFile)) {
//                byte[] buffer = new byte[1024];
//                int length;
//                while ((length = inputStream.read(buffer)) > 0) {
//                    outputStream.write(buffer, 0, length);
//                }
//            }
//
//            // Define paths for FFmpeg command
//            String videoPath = videoFile.getAbsolutePath();
//            String imagePath = imageFile.getAbsolutePath();
//            String outputPath = new File(getExternalFilesDir(Environment.DIRECTORY_MOVIES), "combined_video.mp4").getAbsolutePath();
//
//            // Overlay image on video using FFmpeg
//            String[] cmd = new String[]{
//                    "-i", videoPath,
//                    "-i", imagePath,
//                    "-filter_complex", "[0:v][1:v]overlay=W-w-10:H-h-10",
//                    "-codec:a", "copy",
//                    outputPath
//            };
//
//            int resultCode = FFmpeg.execute(cmd);
//            if (resultCode == 0) {
//                // Get the content URI for the combined video file
//                Uri combinedVideoUri = FileProvider.getUriForFile(this, "com.example.yourapp.provider", new File(outputPath));
//
//                // Create and start the share intent for the combined video
//                Intent shareIntent = new Intent(Intent.ACTION_SEND);
//                shareIntent.setType("video/*");
//                shareIntent.putExtra(Intent.EXTRA_STREAM, combinedVideoUri);
//                shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
//                startActivity(Intent.createChooser(shareIntent, "Share Combined Video"));
//            } else {
//                Log.e("VideoShare", "FFmpeg execution failed with code: " + resultCode);
//            }
//        } else {
            Log.e("VideoShare", "No video selected.");
//        }
    }
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQUEST_PERMISSIONS) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                try {
                    shareVideoAndFrame();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            } else {
                Log.e("VideoShare", "Permissions denied");
                Toast.makeText(this, "Permissions denied", Toast.LENGTH_SHORT).show();
            }
        }
    }
}
