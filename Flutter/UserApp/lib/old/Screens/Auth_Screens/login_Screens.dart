import 'package:fav_app/old/Constants/button.dart';
import 'package:fav_app/old/Constants/text.dart';
import 'package:fav_app/old/Constants/textfield.dart';
import 'package:fav_app/old/ViewModels/Auth/login_view_model.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../Constants/colors.dart';

class LoginScreen extends StatefulWidget {
  LoginScreen({Key? key}) : super(key: key);

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  FocusNode _numberFocus = FocusNode();
  List<String?> number = List.filled(1, '');
  TextEditingController numberController = TextEditingController();

  FocusNode _emailFocus = FocusNode();
  List<String?> email = List.filled(1, '');
  TextEditingController emailController = TextEditingController();
  bool isLoading = false;
  final formKey = GlobalKey<FormState>();
  LoginViewModel? loginViewModel;

  bool validateAndSave() {
    final form = formKey.currentState!;
    if (!form.validate()) {
      return false;
    } else {
      form.save();

      return true;
    }
  }

  @override
  Widget build(BuildContext context) {
    var size = MediaQuery.of(context).size;
    if (mounted) {
      loginViewModel = context.watch<LoginViewModel>();
    }
    return Form(
      key: formKey,
      child: Material(
        child: SafeArea(
          child: Scaffold(
            body: Container(
              height: size.height,
              width: size.width,
              decoration:
                  BoxDecoration(gradient: LinearGradient(colors: lGColor)),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  image(height: size.height, width: size.width),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 25),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          height: size.height * .08,
                        ),
                        constantText(text: 'Quick Login or Sign Up'),
                        SizedBox(
                          height: size.height * .02,
                        ),
                        numberfield(
                          hint: 'Mobile Number',
                        ),
                        // SizedBox(
                        //   height: size.height * .01,
                        // ),
                        // textfield(),
                        SizedBox(
                          height: size.height * .03,
                        ),
                        button(),
                        SizedBox(
                          height: size.height * .04,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget numberfield({String? hint}) {
    return NumbertextFieldWidget(
      context: context,
      textColor: tWhite,
      hintColor: tWhite,
      hint: hint!,
      controller: numberController,
      currentFocus: _numberFocus,
      nextFocus: null,
      holder: number,
      isPhoneNumber: true,
      validationLength: 10,
    );
  }

  Widget image({double? height, double? width}) {
    return Center(
      child: Image.asset(
        'Assets/Images/fav_App_fav_logo.png',
        height: height! * .1,
        width: double.infinity,
        fit: BoxFit.contain,
      ),
    );
  }

  Widget button() {
    return loginViewModel!.isSendingOtp == true
        ? loadingButton(color: tWhite)
        : buttonWidget(
            text: 'GET OTP',
            onTap: () {
              if (validateAndSave()) {
                Map<String, dynamic> body = Map<String, dynamic>();
                body['MobileNumber'] = numberController.text;

                loginViewModel!.sendOtp(
                  context: context,
                  body: body,
                );
              }
            });
  }

  Widget textfield() {
    return textFieldWidget(
        controller: emailController,
        currentFocus: _emailFocus,
        hintColor: tWhite,
        textColor: tWhite,
        nextFocus: null,
        holder: email,
        context: context,
        hint: 'E-Mail',
        isEmail: true);
  }
}
