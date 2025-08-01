export const runtime = "nodejs"; // Using Node.js runtime for Playwright support
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'
import * as path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

async function generateMindFile(imageBuffer: Buffer): Promise<Buffer> {
  // Launch with specific viewport size and device scale factor
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  })
  
  const page = await context.newPage()
  let debugInfo = ''

  try {
    // Enable detailed console logging
    page.on('console', msg => {
      debugInfo += `Browser console: ${msg.text()}\n`
      console.log(`Browser console: ${msg.text()}`)
    })

    page.on('pageerror', err => {
      debugInfo += `Page error: ${err.message}\n`
      console.error(`Page error: ${err.message}`)
    })

    console.log("Opening MindAR example compiler...")
    const response = await page.goto("https://hiukim.github.io/mind-ar-js-doc/tools/compile/", {
      waitUntil: 'networkidle',
      timeout: 60000
    })

    if (!response?.ok()) {
      throw new Error(`Failed to load page: ${response?.status()} ${response?.statusText()}`)
    }

    // Wait for the page to be fully loaded
    console.log("Waiting for page to load...")
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle')
    
    // Log page title for debugging
    const title = await page.title()
    console.log("Page loaded. Title:", title)
    
    // Take screenshot after page load
    await page.screenshot({ path: '/tmp/page-loaded.png' })
    console.log("Page screenshot saved")

    // Debug: Take screenshot of the page
    await page.screenshot({ path: '/tmp/debug-page.png' })
    console.log("Page loaded, screenshot saved")

    // Upload the image
    console.log("Uploading image...")

    // Wait for image to be processed
    console.log("Waiting for image processing...")
    await page.waitForTimeout(2000) // Give time for image processing

    // Wait for any file input to be present (even if hidden)
    console.log("Looking for file input...")
    const fileInput = await page.waitForSelector('input[type="file"]', { 
      state: 'attached',  // Don't require visibility
      timeout: 30000 
    })

    if (!fileInput) {
      const html = await page.content()
      debugInfo += `Page HTML: ${html}\n`
      throw new Error("File input not found. Debug info: " + debugInfo)
    }

    // Upload the image directly to the file input
    console.log("Uploading image to file input...")
    await fileInput.setInputFiles({
      name: 'marker.jpg',
      mimeType: 'image/jpeg',
      buffer: imageBuffer
    })

    // Wait for the image to be processed
    console.log("Waiting for image processing...")
    await page.waitForTimeout(2000)

    // Look for the compile button
    console.log("Looking for compile button...")
    const compileButton = await page.waitForSelector('button:has-text("Compile")', {
      state: 'visible',
      timeout: 30000
    })

    if (!compileButton) {
      throw new Error("Compile button not found")
    }

    // Take screenshot before clicking compile
    await page.screenshot({ path: '/tmp/pre-compile.png' })

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 })

    // Click the Compile button
    console.log("Clicking Compile button...")
    await compileButton.click()

    // Wait for download to start
    console.log("Waiting for download...")
    
    // Wait for either download or error conditions
    console.log("Waiting for download...")
    const result = await Promise.race([
      downloadPromise,
      page.waitForEvent('dialog').then(dialog => {
        dialog.dismiss()
        throw new Error("Unexpected dialog: " + dialog.message())
      }),
      // Watch for error messages
      page.waitForSelector('.error-message, .alert-error, .error', {
        timeout: 30000
      }).then(async element => {
        if (element) {
          const errorText = await element.textContent()
          throw new Error("Error message found on page: " + errorText)
        }
        return null
      }),
      // Also watch for success message
      page.waitForSelector('.success-message, .alert-success, .success', {
        timeout: 30000
      }).then(async element => {
        if (element) {
          console.log("Success message found:", await element.textContent())
        }
        return null
      })
    ])

    // Handle the download if we got one
    if (result && 'path' in result) {
      const download = result
      const downloadPath = await download.path()
      if (!downloadPath) {
        throw new Error("Failed to get download path")
      }

      // Take screenshot after download starts
      await page.screenshot({ path: '/tmp/post-download.png' })

      // Read the downloaded .mind file
      console.log("Reading downloaded file...")
      const mindFile = await download.createReadStream()
      const chunks: Buffer[] = []
      for await (const chunk of mindFile) {
        chunks.push(Buffer.from(chunk))
      }
      
      const fileBuffer = Buffer.concat(chunks)
      console.log("File read successfully, size:", fileBuffer.length)
      
      // Validate file size
      if (fileBuffer.length < 1000) { // .mind files are typically larger
        throw new Error(`Generated .mind file is too small (${fileBuffer.length} bytes). This may indicate a compilation error.`)
      }

      return fileBuffer
    } else {
      // If we got here without a download, something went wrong
      const html = await page.content()
      debugInfo += `\nFinal page HTML: ${html}`
      throw new Error("Compilation completed but no download was triggered. Debug info: " + debugInfo)
    }
    

  } catch (error: any) {
    // On error, capture the page state
    try {
      console.error("Error during mind file generation:", error)
      const html = await page.content()
      debugInfo += `\nFinal page HTML: ${html}`
      debugInfo += `\nError: ${error?.message || String(error)}`
      
      // Take error screenshot
      await page.screenshot({ path: '/tmp/error-page.png' })
      console.log("Error screenshot saved")
      
      throw new Error(`Mind file generation failed: ${error?.message || String(error)}\nDebug info: ${debugInfo}`)
    } catch (screenshotError) {
      console.error("Failed to capture error state:", screenshotError)
      throw error
    }
  } finally {
    await browser.close()
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }

  try {
    const { imageUrl, experienceId } = await request.json()
    if (!imageUrl || !experienceId) {
      return NextResponse.json({ error: 'Missing imageUrl or experienceId' }, { status: 400, headers })
    }
    
    console.log('Downloading image for MindAR compilation:', imageUrl)
    const imageBuffer = await downloadImage(imageUrl)
    
    console.log('Generating MindAR file...')
    const mindFile = await generateMindFile(imageBuffer)
    console.log('MindAR file generated, size:', mindFile.length)
    
    // Upload to Supabase
    const fileName = `mind-${Date.now()}.mind`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('mind-files')
      .upload(fileName, mindFile, {
        contentType: 'application/octet-stream',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload MindAR file: ${uploadError.message}`)
    }

    const { data: urlData } = supabase.storage
      .from('mind-files')
      .getPublicUrl(fileName)
    
    const mindFileUrl = urlData.publicUrl
    console.log('MindAR file uploaded:', mindFileUrl)
    
    // Update the experience
    const { error: updateError } = await supabase
      .from('ar_experiences')
      .update({ mind_file_url: mindFileUrl })
      .eq('id', experienceId)
    
    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update experience: ${updateError.message}`)
    }
    
    console.log('Experience updated with MindAR file URL')

    return NextResponse.json({
      success: true,
      mindFileUrl,
      experienceId,
      message: 'MindAR file compiled and uploaded successfully',
      method: 'playwright-web-compiler',
      note: 'Generated using official MindAR web compiler'
    }, { headers })
    
  } catch (error) {
    console.error('MindAR compilation error:', error)
    return NextResponse.json(
      { error: `MindAR compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500, headers }
    )
  }
} 