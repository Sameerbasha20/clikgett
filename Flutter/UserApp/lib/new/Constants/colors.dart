import 'package:flutter/material.dart';

// Brand Primary Tokens
const Color primary = Color(0xFF26A860);
const Color Appprimary = Color(0xFF26A860);
const Color primaryDark = Color(0xFF1B8A4D);
const Color primaryLight = Color(0xFFE8F8F0);
const Color primaryGhost = Color(0xFFF0FDF4);
Color colorshade = const Color(0xFF26A860).withOpacity(0.45);

// Accent & Status Tokens
const Color yellow = Color(0xFFF9CF09);
const Color amberWarning = Color(0xFFF59E0B);
const Color green = Color(0xFF16A34A);
const Color red = Color(0xFFEF4444);
const Color redLight = Color(0xFFFEF2F2);

// Typography & Content Colors
const Color tColor = Color(0xFF0F172A); // Slate 900
const Color tColor2 = Color(0xFF16A34A); // Brand dark green for emphasis
const Color tColor3 = Color(0xFF475569); // Slate 600
const Color tColor4 = Color(0xFF334155); // Slate 700
const Color tColor5 = Color(0xFF1E293B); // Slate 800
const Color tblack1c = Color(0xFF0F172A);
const Color black = Color(0xFF0F172A);
const Color white = Color(0xFFFFFFFF);
const Color addrescolor = Color(0xFF64748B); // Slate 500
const Color ordersPrimaryColor = Color(0xFF0F172A);
const Color grey70 = Color(0xFF64748B);

// Surfaces, Backgrounds & Borders
const Color homebg = Color(0xFFF8FAFC);
const Color bg = Color(0xFFFFFFFF);
const Color bg1 = Color(0xFFF8FAFC); // Clean neutral screen background
const Color bg2 = Color(0xFFE2E8F0); // Subtle border/divider
const Color bg3 = Color(0xFFF1F5F9); // Subtle inactive card background
const Color cardBorder = Color(0xFFE2E8F0);
const Color offerbg = Color(0xFFF0FDF4);
const Color greyf5 = Color(0xFFF8FAFC);
const Color buttonColor = Color.fromRGBO(15, 23, 42, 0.5);

// Soft quick-commerce box shadows
const List<BoxShadow> softCardShadow = [
  BoxShadow(
    color: Color(0x0A000000),
    blurRadius: 10,
    spreadRadius: 0,
    offset: Offset(0, 3),
  ),
];

const List<BoxShadow> softElevatedShadow = [
  BoxShadow(
    color: Color(0x12000000),
    blurRadius: 16,
    spreadRadius: 0,
    offset: Offset(0, -4),
  ),
];
