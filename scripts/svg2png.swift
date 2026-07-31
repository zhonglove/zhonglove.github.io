import AppKit
import WebKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 5 else {
    print("usage: svg2png <input.svg> <output.png> <width> <height>")
    exit(1)
}
let svgPath = args[1]
let outPath = args[2]
let width = CGFloat(Double(args[3]) ?? 900)
let height = CGFloat(Double(args[4]) ?? 383)

let webView = WKWebView(frame: NSRect(x: 0, y: 0, width: width, height: height))
webView.setValue(false, forKey: "drawsBackground")

let svgContent = (try? String(contentsOfFile: svgPath, encoding: .utf8)) ?? "<svg></svg>"
let html = """
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head>
<body><div style="width:\(Int(width))px;height:\(Int(height))px;">\(svgContent)</div></body></html>
"""

var done = false
webView.loadHTMLString(html, baseURL: nil)

DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
    let config = WKSnapshotConfiguration()
    config.rect = NSRect(x: 0, y: 0, width: width, height: height)
    webView.takeSnapshot(with: config) { image, error in
        if let img = image,
           let tiff = img.tiffRepresentation,
           let rep = NSBitmapImageRep(data: tiff),
           let png = rep.representation(using: .png, properties: [:]) {
            try? png.write(to: URL(fileURLWithPath: outPath))
            print("written \(outPath)")
        } else {
            print("ERROR \(String(describing: error))")
        }
        done = true
    }
}

let deadline = Date().addingTimeInterval(20)
while !done && Date() < deadline {
    RunLoop.main.run(mode: .default, before: Date().addingTimeInterval(0.05))
}
exit(done ? 0 : 1)
