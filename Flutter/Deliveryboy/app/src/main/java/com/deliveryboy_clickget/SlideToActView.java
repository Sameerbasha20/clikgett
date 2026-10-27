package com.deliveryboy_clickget;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.text.TextPaint;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.accessibility.AccessibilityManager;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.OvershootInterpolator;

import androidx.core.content.ContextCompat;
import androidx.core.graphics.drawable.DrawableCompat;

/**
 * "Slide to confirm" button for the rider's next step, so a pocket tap can't
 * move an order on. A tap only nudges the knob to show it slides; with
 * TalkBack on, a double tap performs the action.
 */
public class SlideToActView extends View {

    public interface OnSlideCompleteListener {
        void onSlideComplete();
    }

    private final Paint trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint trailPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint thumbPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final TextPaint textPaint = new TextPaint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rect = new RectF();

    private String text = "";
    private Drawable icon;
    private int color;
    private float thumbOffset;
    private boolean dragging;
    private float downX, downOffset;
    private ValueAnimator animator;
    private OnSlideCompleteListener listener;

    public SlideToActView(Context context, AttributeSet attrs) {
        super(context, attrs);
        color = ContextCompat.getColor(context, R.color.clikgett_green_primary);
        textPaint.setColor(Color.WHITE);
        textPaint.setTextSize(16 * getResources().getDisplayMetrics().scaledDensity);
        textPaint.setTypeface(Typeface.DEFAULT_BOLD);
        textPaint.setLetterSpacing(0.02f);
        textPaint.setTextAlign(Paint.Align.CENTER);
        thumbPaint.setColor(Color.WHITE);
        thumbPaint.setShadowLayer(dp(3), 0, dp(1), 0x33000000);
        setLayerType(LAYER_TYPE_SOFTWARE, thumbPaint);
        setFocusable(true);
        setClickable(true);
        setIcon(R.drawable.baseline_keyboard_arrow_right_24);
    }

    public void setOnSlideCompleteListener(OnSlideCompleteListener l) {
        listener = l;
    }

    public void setText(String t) {
        text = t != null ? t : "";
        setContentDescription(text);
        invalidate();
    }

    public void setIcon(int resId) {
        Drawable d = resId != 0 ? ContextCompat.getDrawable(getContext(), resId) : null;
        icon = d != null ? DrawableCompat.wrap(d.mutate()) : null;
        invalidate();
    }

    public void setColor(int c) {
        color = c;
        invalidate();
    }

    @Override
    public void setEnabled(boolean enabled) {
        super.setEnabled(enabled);
        if (!enabled) reset();
        invalidate();
    }

    /** Knob back to the start (after the step changed, or the action was cancelled). */
    public void reset() {
        if (dragging) return;
        if (animator != null) animator.cancel();
        thumbOffset = 0;
        invalidate();
    }

    private float thumbSize() {
        return getHeight() - 2 * inset();
    }

    private float inset() {
        return dp(5);
    }

    private float maxOffset() {
        return Math.max(0, getWidth() - 2 * inset() - thumbSize());
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth(), h = getHeight(), r = h / 2f;
        float progress = maxOffset() > 0 ? thumbOffset / maxOffset() : 0;
        int base = isEnabled() ? color : ContextCompat.getColor(getContext(), R.color.clikgett_text_muted);

        trackPaint.setColor(base);
        rect.set(0, 0, w, h);
        canvas.drawRoundRect(rect, r, r, trackPaint);

        // Lighter trail behind the knob.
        float thumbLeft = inset() + thumbOffset;
        float size = thumbSize();
        if (thumbOffset > 0) {
            trailPaint.setColor(0x33FFFFFF);
            rect.set(inset(), inset(), thumbLeft + size, inset() + size);
            canvas.drawRoundRect(rect, size / 2f, size / 2f, trailPaint);
        }

        // Label, fading out as the knob slides over it.
        float textLeft = inset() + size + dp(8);
        float available = w - textLeft - dp(16);
        CharSequence label = TextUtils.ellipsize(text, textPaint, Math.max(0, available), TextUtils.TruncateAt.END);
        textPaint.setAlpha((int) (255 * Math.max(0, 1 - progress * 1.6f)));
        float textY = h / 2f - (textPaint.descent() + textPaint.ascent()) / 2f;
        canvas.drawText(label, 0, label.length(), textLeft + available / 2f, textY, textPaint);

        // Knob with the step icon.
        rect.set(thumbLeft, inset(), thumbLeft + size, inset() + size);
        thumbPaint.setAlpha(isEnabled() ? 255 : 170);
        canvas.drawOval(rect, thumbPaint);
        if (icon != null) {
            DrawableCompat.setTint(icon, base);
            int pad = Math.round(size * 0.24f);
            icon.setBounds(Math.round(rect.left) + pad, Math.round(rect.top) + pad,
                    Math.round(rect.right) - pad, Math.round(rect.bottom) - pad);
            icon.draw(canvas);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (!isEnabled()) return false;
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                if (animator != null) animator.cancel();
                downX = e.getX();
                downOffset = thumbOffset;
                dragging = true;
                getParent().requestDisallowInterceptTouchEvent(true);
                return true;
            case MotionEvent.ACTION_MOVE:
                thumbOffset = Math.max(0, Math.min(maxOffset(), downOffset + e.getX() - downX));
                invalidate();
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                dragging = false;
                boolean moved = Math.abs(e.getX() - downX) > dp(8);
                if (e.getActionMasked() == MotionEvent.ACTION_UP && thumbOffset >= maxOffset() * 0.85f) {
                    animateTo(maxOffset(), 120, this::complete);
                } else if (!moved && e.getActionMasked() == MotionEvent.ACTION_UP) {
                    nudge();
                } else {
                    animateTo(0, 260, null);
                }
                return true;
        }
        return super.onTouchEvent(e);
    }

    @Override
    public boolean performClick() {
        super.performClick();
        AccessibilityManager am = (AccessibilityManager) getContext().getSystemService(Context.ACCESSIBILITY_SERVICE);
        if (isEnabled() && am != null && am.isTouchExplorationEnabled()) complete();
        return true;
    }

    private void complete() {
        performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        if (listener != null) listener.onSlideComplete();
        // Return the knob whether the step went through or was cancelled.
        postDelayed(() -> animateTo(0, 300, null), 700);
    }

    /** A tap shows the knob slides: a little push and back. */
    private void nudge() {
        animateTo(Math.min(dp(44), maxOffset()), 180, () -> {
            if (animator != null) animator.cancel();
            animator = ValueAnimator.ofFloat(thumbOffset, 0);
            animator.setDuration(420);
            animator.setInterpolator(new OvershootInterpolator(2.5f));
            animator.addUpdateListener(a -> {
                thumbOffset = Math.max(0, (float) a.getAnimatedValue());
                invalidate();
            });
            animator.start();
        });
    }

    private void animateTo(float target, long ms, Runnable end) {
        if (animator != null) animator.cancel();
        animator = ValueAnimator.ofFloat(thumbOffset, target);
        animator.setDuration(ms);
        animator.setInterpolator(new DecelerateInterpolator());
        animator.addUpdateListener(a -> {
            thumbOffset = (float) a.getAnimatedValue();
            invalidate();
        });
        if (end != null) {
            animator.addListener(new android.animation.AnimatorListenerAdapter() {
                private boolean cancelled;

                @Override
                public void onAnimationCancel(android.animation.Animator animation) {
                    cancelled = true;
                }

                @Override
                public void onAnimationEnd(android.animation.Animator animation) {
                    if (!cancelled) end.run();
                }
            });
        }
        animator.start();
    }

    private float dp(float v) {
        return v * getResources().getDisplayMetrics().density;
    }
}
