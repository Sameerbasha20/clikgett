package com.deliveryboy_clickget.Utils;

import android.content.Context;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import com.deliveryboy_clickget.BuildConfig;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/**
 * Finds the ClikGett backend on the phone's Wi-Fi when the PC's IP has changed.
 *
 * For a local build (API_BASE_URL is http on a private IP) only its port and path
 * matter: if the current address doesn't answer, the phone's /24 network is scanned
 * for a server on that port whose /health says it is the ClikGett backend. The
 * address found is remembered for the next launch. Builds pointing at a public
 * https domain are left alone.
 */
public final class BackendDiscovery {
    private static final String TAG = "BackendDiscovery";
    private static final String PREFS = "BackendDiscovery";
    private static final String KEY_URL = "api_base_url";
    private static final String SERVICE = "clikgett-backend";

    private BackendDiscovery() {
    }

    /** Applies the address found on an earlier launch. No network access. */
    public static void loadSaved(Context context) {
        if (!isLocalBuild()) return;
        String saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY_URL, null);
        if (saved != null) CommonUtilities.URL = saved;
    }

    /** Checks the current address, scans the Wi-Fi if needed, then runs onDone on the main thread. */
    public static void ensureBackend(Context context, Runnable onDone) {
        final Context app = context.getApplicationContext();
        final Handler main = new Handler(Looper.getMainLooper());
        new Thread(() -> {
            try {
                discover(app);
            } catch (Exception e) {
                Log.w(TAG, "Discovery failed", e);
            }
            main.post(onDone);
        }, TAG).start();
    }

    private static void discover(Context context) throws Exception {
        if (!isLocalBuild()) return;
        Uri built = Uri.parse(BuildConfig.API_BASE_URL);
        int port = built.getPort();

        String currentHost = Uri.parse(CommonUtilities.URL).getHost();
        if (isClikGett(currentHost, port)) return;
        if (!built.getHost().equals(currentHost) && isClikGett(built.getHost(), port)) {
            apply(context, BuildConfig.API_BASE_URL);
            return;
        }

        String host = scan(port);
        if (host == null) {
            Log.w(TAG, "No ClikGett backend found on port " + port + "; keeping " + CommonUtilities.URL);
            return;
        }
        String url = built.buildUpon().encodedAuthority(host + ":" + port).build().toString();
        Log.i(TAG, "Backend found at " + url);
        apply(context, url);
    }

    private static void apply(Context context, String url) {
        CommonUtilities.URL = url;
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY_URL, url).apply();
    }

    private static boolean isLocalBuild() {
        Uri built = Uri.parse(BuildConfig.API_BASE_URL);
        return "http".equals(built.getScheme()) && isPrivate(built.getHost());
    }

    private static boolean isPrivate(String host) {
        return host != null && host.matches("^(10\\.\\d+|172\\.(1[6-9]|2\\d|3[01])|192\\.168)\\.\\d+\\.\\d+$");
    }

    private static boolean isClikGett(String host, int port) {
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL("http://" + host + ":" + port + "/health").openConnection();
            conn.setConnectTimeout(1500);
            conn.setReadTimeout(1500);
            InputStream in = conn.getResponseCode() >= 400 ? conn.getErrorStream() : conn.getInputStream();
            if (in == null) return false;
            StringBuilder body = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(in))) {
                String line;
                while ((line = reader.readLine()) != null) body.append(line);
            }
            return SERVICE.equals(new JSONObject(body.toString()).optString("service"));
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    /** Wi-Fi networks first; a quick TCP probe across each /24, then /health to confirm. */
    private static String scan(int port) throws Exception {
        List<NetworkInterface> interfaces = Collections.list(NetworkInterface.getNetworkInterfaces());
        Collections.sort(interfaces, (a, b) -> Boolean.compare(b.getName().contains("wlan"), a.getName().contains("wlan")));

        Set<String> prefixes = new LinkedHashSet<>();
        for (NetworkInterface iface : interfaces) {
            for (InetAddress addr : Collections.list(iface.getInetAddresses())) {
                String ip = addr.getHostAddress();
                if (addr instanceof Inet4Address && isPrivate(ip)) {
                    prefixes.add(ip.substring(0, ip.lastIndexOf('.')));
                }
            }
        }

        ExecutorService pool = Executors.newFixedThreadPool(64);
        try {
            for (String prefix : prefixes) {
                List<String> hosts = new ArrayList<>();
                List<Callable<Boolean>> probes = new ArrayList<>();
                for (int i = 1; i < 255; i++) {
                    final String host = prefix + "." + i;
                    hosts.add(host);
                    probes.add(() -> portOpen(host, port));
                }
                List<Future<Boolean>> open = pool.invokeAll(probes);
                for (int i = 0; i < hosts.size(); i++) {
                    if (open.get(i).get() && isClikGett(hosts.get(i), port)) return hosts.get(i);
                }
            }
            return null;
        } finally {
            pool.shutdownNow();
        }
    }

    private static boolean portOpen(String host, int port) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), 400);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
