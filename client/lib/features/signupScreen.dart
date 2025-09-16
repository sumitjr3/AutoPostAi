import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_sign_in/google_sign_in.dart';

class SignUpScreen extends StatelessWidget {
  const SignUpScreen({super.key});

  // Function to handle Google Sign-In
  Future<void> _handleGoogleSignIn() async {
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn().signIn();
      if (googleUser != null) {
        // Navigate to the dashboard or home screen after successful login
        // Get.offAll(() => const DashboardScreen());
      }
    } catch (error) {
      Get.snackbar(
        'Error',
        'Failed to sign in with Google: $error',
        snackPosition: SnackPosition.BOTTOM,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0A192F), Color(0xFF112240)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'Welcome to AutoPost AI',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Sign up to automate your hyper-local content creation.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 16, color: Colors.white60),
              ),
              const SizedBox(height: 40),
              ElevatedButton.icon(
                onPressed: _handleGoogleSignIn,
                icon: Image.asset(
                  'assets/google_logo.png', // Add the Google logo to your assets
                  height: 24,
                ),
                label: const Text(
                  'Login with Google',
                  style: TextStyle(fontSize: 16, color: Colors.black87),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 12,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
