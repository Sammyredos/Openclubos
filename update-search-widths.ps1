$files = Get-ChildItem -Path "c:\Users\samue\Desktop\Openclubos\apps\web-admin\app" -Recurse -Filter "*.tsx"
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        $replaced = $false
        
        if ($content -match 'className="relative flex-1 min-w-\[280px\] max-w-\[800px\]"') {
            $content = $content -replace 'className="relative flex-1 min-w-\[280px\] max-w-\[800px\]"', 'className="relative flex-1 min-w-[240px] max-w-[500px]"'
            $replaced = $true
        }
        
        if ($content -match 'className="relative flex-1 min-w-\[240px\] max-w-\[800px\]"') {
            $content = $content -replace 'className="relative flex-1 min-w-\[240px\] max-w-\[800px\]"', 'className="relative flex-1 min-w-[240px] max-w-[500px]"'
            $replaced = $true
        }
        
        if ($replaced) {
            [System.IO.File]::WriteAllText($file.FullName, $content)
            Write-Host "Updated $($file.FullName)"
        }
    } catch {
        Write-Host "Failed to read $($file.FullName)"
    }
}
