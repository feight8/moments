# Get list of files changed vs main branch
$changed = git diff --name-only origin/main HEAD

if (-not $changed) {
    Write-Host "No changes detected, running smoke suite"
    npx playwright test tests/smoke/
    exit 0
}

Write-Host "Changed files:"
$changed | ForEach-Object { Write-Host "  $_" }

# Find test files that cover any of the changed files
$impacted = @()

Get-ChildItem -Path "tests" -Recurse -Filter "*.spec.ts" | ForEach-Object {
    $testFile = $_.FullName
    $content = Get-Content $testFile -Raw

    # Check if this test file has a @covers line
    if ($content -match "@covers:(.+)") {
        $coveredFiles = $matches[1] -split "," | ForEach-Object { $_.Trim() }

        # See if any changed file is in the @covers list
        foreach ($changedFile in $changed) {
            foreach ($covered in $coveredFiles) {
                if ($changedFile -like "*$covered*" -or $covered -like "*$changedFile*") {
                    $impacted += $testFile
                    break
                }
            }
        }
    }
}

# Remove duplicates
$impacted = $impacted | Select-Object -Unique

if ($impacted.Count -eq 0) {
    Write-Host "No impacted tests found, running smoke suite"
    npx playwright test tests/smoke/
} else {
    Write-Host "Running $($impacted.Count) impacted test file(s):"
    $impacted | ForEach-Object { Write-Host "  $_" }
    
    # Build the playwright command with all impacted files
    $args = $impacted -join " "
    npx playwright test $impacted
}