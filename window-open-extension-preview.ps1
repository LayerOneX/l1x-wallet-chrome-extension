Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll", SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    
    public static readonly IntPtr HWND_TOPMOST = new IntPtr(-1);
    public static readonly IntPtr HWND_NOTOPMOST = new IntPtr(-2);
    public const UInt32 SWP_NOSIZE = 0x0001;
    public const UInt32 SWP_NOMOVE = 0x0002;
    public const UInt32 SWP_SHOWWINDOW = 0x0040;
}
"@

# Start Chrome with the specified parameters
$chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$url = "http://localhost:3000"
$htmlContent = "<html><body><script>window.moveTo(580,240);window.resizeTo(400,600);window.location='$url';</script></body></html>"
Start-Process -FilePath $chromePath -ArgumentList "--chrome-frame --app=data:text/html,$htmlContent"

# Wait for a short period to allow the Chrome window to open
Start-Sleep -Seconds 2

# Get the Chrome window handle and set it as always on top
$chromeWindow = Get-Process | Where-Object { $_.MainWindowTitle -like "*Google*" } | Select-Object -First 1
if ($chromeWindow) {
    $hWnd = $chromeWindow.MainWindowHandle
    [Win32]::SetWindowPos($hWnd, [Win32]::HWND_TOPMOST, 0, 0, 0, 0, [Win32]::SWP_NOMOVE -bor [Win32]::SWP_NOSIZE -bor [Win32]::SWP_SHOWWINDOW)
}
