/** @type {import('expo-apple-targets').Config} */
module.exports = {
  type: "widget",
  icon: "../../assets/icon.png",
  entitlements: {
    "com.apple.security.application-groups": ["group.com.konbinichokin.app"],
  },
};
