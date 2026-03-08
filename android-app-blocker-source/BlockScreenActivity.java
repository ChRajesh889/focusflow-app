package com.focusflow.blocker;

import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
import android.widget.Button;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.content.Intent;

public class BlockScreenActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        String packageName = getIntent().getStringExtra("packageName");

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setGravity(Gravity.CENTER);
        layout.setBackgroundColor(Color.parseColor("#1a1a2e")); // Dark background
        layout.setPadding(50, 50, 50, 50);

        TextView title = new TextView(this);
        title.setText("Stay Focused!");
        title.setTextSize(32);
        title.setTextColor(Color.WHITE);
        title.setGravity(Gravity.CENTER);
        
        TextView message = new TextView(this);
        message.setText("FocusFlow has blocked this distracting app (" + packageName + ") during your active session.");
        message.setTextSize(18);
        message.setTextColor(Color.LTGRAY);
        message.setGravity(Gravity.CENTER);
        message.setPadding(0, 40, 0, 80);

        Button homeButton = new Button(this);
        homeButton.setText("Go Back to Home");
        homeButton.setBackgroundColor(Color.parseColor("#4caf50"));
        homeButton.setTextColor(Color.WHITE);
        homeButton.setOnClickListener(v -> {
            Intent startMain = new Intent(Intent.ACTION_MAIN);
            startMain.addCategory(Intent.CATEGORY_HOME);
            startMain.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(startMain);
            finish();
        });

        layout.addView(title);
        layout.addView(message);
        layout.addView(homeButton);

        setContentView(layout);
    }
    
    // Disable Back Button so user cannot bypass
    @Override
    public void onBackPressed() {
        // Do nothing
    }
}
