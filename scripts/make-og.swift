#!/usr/bin/env swift
// Renders assets/og-image.png (1200×630) for link previews, from assets/icon-512.png.
// Usage: swift scripts/make-og.swift   (from the repository root; macOS only)
import AppKit

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let iconURL = root.appendingPathComponent("assets/icon-512.png")
let out = root.appendingPathComponent("assets/og-image.png")
let size = NSSize(width: 1200, height: 630)

func color(_ hex: UInt32, _ a: CGFloat = 1) -> NSColor {
    NSColor(srgbRed: CGFloat((hex >> 16) & 0xFF) / 255, green: CGFloat((hex >> 8) & 0xFF) / 255,
            blue: CGFloat(hex & 0xFF) / 255, alpha: a)
}

let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: Int(size.width), pixelsHigh: Int(size.height),
                           bitsPerSample: 8, samplesPerPixel: 4, hasAlpha: true, isPlanar: false,
                           colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)

// Background: petrol gradient with a soft teal glow.
NSGradient(colors: [color(0x147060), color(0x0B2F2A)])!.draw(in: NSRect(origin: .zero, size: size), angle: -60)
NSGradient(colors: [color(0x2BCB86, 0.45), color(0x2BCB86, 0)])!
    .draw(in: NSBezierPath(ovalIn: NSRect(x: 700, y: 250, width: 700, height: 600)), relativeCenterPosition: .zero)

// Threshold line across the whole card.
let lineY: CGFloat = 330
let glow = NSShadow()
glow.shadowColor = color(0xC6FF6B, 0.9)
glow.shadowBlurRadius = 24
NSGraphicsContext.saveGraphicsState()
glow.set()
color(0xC6FF6B).setFill()
NSBezierPath(roundedRect: NSRect(x: 0, y: lineY - 3, width: size.width, height: 6), xRadius: 3, yRadius: 3).fill()
NSGraphicsContext.restoreGraphicsState()

// Icon.
if let icon = NSImage(contentsOf: iconURL) {
    icon.draw(in: NSRect(x: 90, y: 165, width: 300, height: 300))
}

// Text.
let title = NSAttributedString(string: "Limiar", attributes: [
    .font: NSFont.systemFont(ofSize: 96, weight: .bold),
    .foregroundColor: NSColor.white,
    .kern: -3,
])
title.draw(at: NSPoint(x: 440, y: 360))

let para = NSMutableParagraphStyle()
para.lineSpacing = 6
let subtitle = NSAttributedString(string: "Your Mac stops charging where you tell it to.\nWorks on macOS 27 · Free & open source", attributes: [
    .font: NSFont.systemFont(ofSize: 34, weight: .medium),
    .foregroundColor: NSColor.white.withAlphaComponent(0.85),
    .paragraphStyle: para,
])
subtitle.draw(in: NSRect(x: 444, y: 170, width: 700, height: 140))

NSGraphicsContext.restoreGraphicsState()
try rep.representation(using: .png, properties: [:])!.write(to: out)
print("Wrote \(out.path)")
