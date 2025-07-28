import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitorjs.com/docs/plugins/ios
 */
@objc(CowinCustomizedPluginPlugin)
public class CowinCustomizedPluginPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CowinCustomizedPluginPlugin"
    public let jsName = "CowinCustomizedPlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    private let implementation = CowinCustomizedPlugin()

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve([
            "value": implementation.echo(value)
        ])
    }
}
