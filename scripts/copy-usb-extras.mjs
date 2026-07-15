// Copies the end-user instructions onto the USB build output so distributing
// the app is just "copy the contents of dist-usb/ to the stick".
import { copyFileSync } from 'node:fs'

copyFileSync('usb/START HERE.txt', 'dist-usb/START HERE.txt')
console.log('Copied "START HERE.txt" into dist-usb/')
