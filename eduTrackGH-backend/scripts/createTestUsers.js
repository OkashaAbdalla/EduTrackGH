/**
 * Create Test Users Script
 * Purpose: Quickly create test users for different roles
 * Usage: node scripts/createTestUsers.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const createTestUsers = async () => {
  try {
    await connectDB();
    console.log("📦 Connected to MongoDB");

    // Test Admin
    const adminExists = await User.findOne({ email: "admin@edutrack.test" });
    if (!adminExists) {
      const admin = await User.create({
        fullName: "System Admin",
        email: "admin@edutrack.test",
        phone: "0240000001",
        password: "admin123",
        role: "admin",
        isVerified: true,
        isActive: true,
      });
      console.log("✅ Admin created:", admin.email, "| Password: admin123");
    } else {
      console.log("ℹ️  Admin already exists:", adminExists.email);
    }

    // Test Primary Headteacher
    const primaryHeadteacherExists = await User.findOne({
      email: "headteacher.primary@edutrack.test",
    });
    if (!primaryHeadteacherExists) {
      const primaryHeadteacher = await User.create({
        fullName: "Amina Yakubu",
        email: "headteacher.primary@edutrack.test",
        phone: "0240000002",
        password: "headteacher123",
        role: "headteacher",
        schoolLevel: "PRIMARY",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ Primary Headteacher created:",
        primaryHeadteacher.email,
        "| Password: headteacher123",
      );
    } else {
      console.log(
        "ℹ️  Primary Headteacher already exists:",
        primaryHeadteacherExists.email,
      );
    }

    // Test JHS Headteacher
    const jhsHeadteacherExists = await User.findOne({
      email: "headteacher.jhs@edutrack.test",
    });
    if (!jhsHeadteacherExists) {
      const jhsHeadteacher = await User.create({
        fullName: "Kwame Asante",
        email: "headteacher.jhs@edutrack.test",
        phone: "0240000005",
        password: "headteacher123",
        role: "headteacher",
        schoolLevel: "JHS",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ JHS Headteacher created:",
        jhsHeadteacher.email,
        "| Password: headteacher123",
      );
    } else {
      console.log(
        "ℹ️  JHS Headteacher already exists:",
        jhsHeadteacherExists.email,
      );
    }

    // Test Primary Teacher
    const primaryTeacherExists = await User.findOne({
      email: "teacher.primary@edutrack.test",
    });
    if (!primaryTeacherExists) {
      const primaryTeacher = await User.create({
        fullName: "Grace Osei",
        email: "teacher.primary@edutrack.test",
        phone: "0240000003",
        password: "teacher123",
        role: "teacher",
        schoolLevel: "PRIMARY",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ Primary Teacher created:",
        primaryTeacher.email,
        "| Password: teacher123",
      );
    } else {
      console.log(
        "ℹ️  Primary Teacher already exists:",
        primaryTeacherExists.email,
      );
    }

    // Test JHS Teacher
    const jhsTeacherExists = await User.findOne({
      email: "teacher.jhs@edutrack.test",
    });
    if (!jhsTeacherExists) {
      const jhsTeacher = await User.create({
        fullName: "David Boateng",
        email: "teacher.jhs@edutrack.test",
        phone: "0240000006",
        password: "teacher123",
        role: "teacher",
        schoolLevel: "JHS",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ JHS Teacher created:",
        jhsTeacher.email,
        "| Password: teacher123",
      );
    } else {
      console.log(
        "ℹ️  JHS Teacher already exists:",
        jhsTeacherExists.email,
      );
    }

    // Keep old single teacher for backward compatibility
    const teacherExists = await User.findOne({
      email: "teacher@edutrack.test",
    });
    if (!teacherExists) {
      const teacher = await User.create({
        fullName: "John Mensah",
        email: "teacher@edutrack.test",
        phone: "0240000007",
        password: "teacher123",
        role: "teacher",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ Teacher created:",
        teacher.email,
        "| Password: teacher123",
      );
    } else {
      console.log("ℹ️  Teacher already exists:", teacherExists.email);
    }

    // Test Parent
    const parentExists = await User.findOne({ email: "parent@edutrack.test" });
    if (!parentExists) {
      const parent = await User.create({
        fullName: "Fatima Alhassan",
        email: "parent@edutrack.test",
        phone: "0240000004",
        password: "parent123",
        role: "parent",
        isVerified: true,
        isActive: true,
      });
      console.log("✅ Parent created:", parent.email, "| Password: parent123");
    } else {
      console.log("ℹ️  Parent already exists:", parentExists.email);
    }

    // Test Parent with custom email
    const customParentExists = await User.findOne({
      email: "okashamach44@gmail.com",
    });
    if (!customParentExists) {
      const customParent = await User.create({
        fullName: "Okasha Abdalla",
        email: "okashamach44@gmail.com",
        phone: "0240000099",
        password: "password123",
        role: "parent",
        isVerified: true,
        isActive: true,
      });
      console.log(
        "✅ Custom Parent created:",
        customParent.email,
        "| Password: password123",
      );
    } else {
      console.log(
        "ℹ️  Custom Parent already exists:",
        customParentExists.email,
      );
    }

    console.log("\n🎉 Test users created successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Admin:                     admin@edutrack.test / admin123");
    console.log(
      "Primary Headteacher:       headteacher.primary@edutrack.test / headteacher123",
    );
    console.log(
      "JHS Headteacher:           headteacher.jhs@edutrack.test / headteacher123",
    );
    console.log("Primary Teacher:           teacher.primary@edutrack.test / teacher123");
    console.log("JHS Teacher:               teacher.jhs@edutrack.test / teacher123");
    console.log("Generic Teacher:           teacher@edutrack.test / teacher123");
    console.log("Parent:                    parent@edutrack.test / parent123");
    console.log("Custom Parent:             okashamach44@gmail.com / password123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test users:", error.message);
    process.exit(1);
  }
};

createTestUsers();
