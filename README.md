# Sunlytics 2

Lightweight React Native app for solar energy estimation and billing assistance.

## Project Overview

Sunlytics 2 is a mobile app that helps estimate appliance energy usage, assess roof suitability, and produce simple bill/solar recommendations.

## Features

- Appliance energy calculators
- Location and roof assessment flows
- User authentication (signup/login)
- Result summary and recommendations

## Tech Stack

- React Native
- Native Android (under `android/`)

## Getting Started

Prerequisites:

- Node.js and npm or Yarn
- Android SDK / Android Studio for Android builds

Install dependencies:

```
npm install
# or
yarn install
```

Run on Android (development):

```
npx react-native run-android
```

Open the Android native project in Android Studio for signing and release builds: open the `android/` folder.

## Project Structure (key files)

- App entry: [App.js](Sunlytics%202/App.js#L1)
- Main Android activity: [android/app/src/main/java/com/anonymous/sunlytics2/MainActivity.kt](Sunlytics%202/android/app/src/main/java/com/anonymous/sunlytics2/MainActivity.kt#L1)
- Main application: [android/app/src/main/java/com/anonymous/sunlytics2/MainApplication.kt](Sunlytics%202/android/app/src/main/java/com/anonymous/sunlytics2/MainApplication.kt#L1)
- Context: [context/AppContext.js](Sunlytics%202/context/AppContext.js#L1)
- Components:
  - [components/Card.js](Sunlytics%202/components/Card.js#L1)
  - [components/PrimaryButton.js](Sunlytics%202/components/PrimaryButton.js#L1)
  - [components/SliderInput.js](Sunlytics%202/components/SliderInput.js#L1)
- Screens:
  - [screens/HomeScreen.js](Sunlytics%202/screens/HomeScreen.js#L1)
  - [screens/LoginScreen.js](Sunlytics%202/screens/LoginScreen.js#L1)
  - [screens/SignupScreen.js](Sunlytics%202/screens/SignupScreen.js#L1)
  - [screens/AssessScreen.js](Sunlytics%202/screens/AssessScreen.js#L1)
  - [screens/ResultScreen.js](Sunlytics%202/screens/ResultScreen.js#L1)
  - [screens/BillScreen.js](Sunlytics%202/screens/BillScreen.js#L1)
  - [screens/RoofScreen.js](Sunlytics%202/screens/RoofScreen.js#L1)
  - [screens/AppliancesScreen.js](Sunlytics%202/screens/AppliancesScreen.js#L1)
  - [screens/LocationScreen.js](Sunlytics%202/screens/LocationScreen.js#L1)
- Data: [data/panels.json](Sunlytics%202/data/panels.json#L1)

## Notes

- This repo uses a native Android project; building for iOS requires additional setup.
- `App.js` is the main React Native entry; modify navigation and screens there.

## Contributing

1. Fork the repo
2. Create a feature branch
3. Open a PR with a clear description

## License

Specify your license here (e.g., MIT).
