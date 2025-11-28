// Test script to verify the search API works
async function testSearch() {
    try {
        console.log('Testing search API...')
        const response = await fetch('http://localhost:3000/api/empresas/search?q=EIMISA')

        console.log('Status:', response.status)
        console.log('Status Text:', response.statusText)

        const data = await response.json()
        console.log('Response:', JSON.stringify(data, null, 2))

        if (response.ok && Array.isArray(data) && data.length > 0) {
            console.log('✅ Search is working! Found:', data.length, 'results')
        } else if (response.ok && Array.isArray(data) && data.length === 0) {
            console.log('⚠️ Search returned no results')
        } else {
            console.log('❌ Search failed:', data)
        }
    } catch (error) {
        console.error('❌ Error:', error)
    }
}

testSearch()
