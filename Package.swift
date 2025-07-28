// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CowinPlugin",
    platforms: [.iOS(.v13)],
    products: [
        .library(
            name: "CowinPlugin",
            targets: ["CowinCustomizedPluginPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", branch: "main")
    ],
    targets: [
        .target(
            name: "CowinCustomizedPluginPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/CowinCustomizedPluginPlugin"),
        .testTarget(
            name: "CowinCustomizedPluginPluginTests",
            dependencies: ["CowinCustomizedPluginPlugin"],
            path: "ios/Tests/CowinCustomizedPluginPluginTests")
    ]
)