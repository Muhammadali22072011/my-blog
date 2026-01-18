// ============================================================================
// SECURITY TEST SCRIPT
// ============================================================================
// Этот скрипт тестирует безопасность админ-панели
// Запуск: node test-security.js

const SUPABASE_URL = 'https://rfppkhwqnlkpjemmoexg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmcHBraHdxbmxrcGplbW1vZXhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MDAyNDcsImV4cCI6MjA3MTE3NjI0N30.KNDzI-PDysx7SJoFWtSqWyb5ZejTL1QVa5CwHw1IgFE'

async function testEdgeFunction(functionName, body) {
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    return { error: error.message }
  }
}

async function runTests() {
  console.log('🔒 Testing Secure Admin Authentication\n')

  // Test 1: Проверка admin-auth функции
  console.log('Test 1: Testing admin-auth Edge Function')
  const authResult = await testEdgeFunction('admin-auth', {
    step: 1,
    clockTime: '12:00',
  })
  
  if (authResult.error) {
    console.log('❌ Edge Function not deployed or not accessible')
    console.log('   Error:', authResult.error)
    console.log('   Run: supabase functions deploy admin-auth\n')
  } else if (authResult.status === 200) {
    console.log('✅ admin-auth is working')
    console.log('   Response:', authResult.data)
  } else {
    console.log('⚠️  admin-auth returned status:', authResult.status)
    console.log('   Response:', authResult.data)
  }
  console.log('')

  // Test 2: Проверка admin-validate функции
  console.log('Test 2: Testing admin-validate Edge Function')
  const validateResult = await testEdgeFunction('admin-validate', {
    sessionToken: 'test-token-123',
  })
  
  if (validateResult.error) {
    console.log('❌ Edge Function not deployed or not accessible')
    console.log('   Error:', validateResult.error)
    console.log('   Run: supabase functions deploy admin-validate\n')
  } else if (validateResult.status === 200) {
    console.log('✅ admin-validate is working')
    console.log('   Response:', validateResult.data)
  } else {
    console.log('⚠️  admin-validate returned status:', validateResult.status)
    console.log('   Response:', validateResult.data)
  }
  console.log('')

  // Test 3: Проверка rate limiting
  console.log('Test 3: Testing rate limiting (10 requests)')
  let blockedCount = 0
  
  for (let i = 0; i < 12; i++) {
    const result = await testEdgeFunction('admin-auth', {
      step: 1,
      clockTime: 'wrong',
    })
    
    if (result.status === 429) {
      blockedCount++
    }
    
    // Небольшая задержка между запросами
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  if (blockedCount > 0) {
    console.log(`✅ Rate limiting is working (blocked ${blockedCount}/12 requests)`)
  } else {
    console.log('⚠️  Rate limiting might not be working')
    console.log('   Check the check_rate_limit function in database')
  }
  console.log('')

  // Test 4: Проверка неправильных ответов
  console.log('Test 4: Testing wrong answers')
  const wrongAnswers = [
    { step: 1, clockTime: '11:00' },
    { step: 4, answer: [1, 2, 3] },
    { step: 5, answer: [1, 2, 3, 4, 5] },
  ]
  
  for (const test of wrongAnswers) {
    const result = await testEdgeFunction('admin-auth', test)
    if (result.data?.success === false) {
      console.log(`✅ Step ${test.step}: Correctly rejected wrong answer`)
    } else {
      console.log(`⚠️  Step ${test.step}: Unexpected response:`, result.data)
    }
  }
  console.log('')

  // Test 5: Проверка правильных ответов
  console.log('Test 5: Testing correct answers')
  const correctAnswers = [
    { step: 1, clockTime: '12:00' },
    { step: 4, answer: [1, 2, 5, 8, 9] },
    { step: 5, answer: [1, 1, 2, 3, 5, 8] },
  ]
  
  for (const test of correctAnswers) {
    const result = await testEdgeFunction('admin-auth', test)
    if (result.data?.success === true) {
      console.log(`✅ Step ${test.step}: Correctly accepted right answer`)
    } else {
      console.log(`⚠️  Step ${test.step}: Unexpected response:`, result.data)
    }
  }
  console.log('')

  // Итоги
  console.log('═══════════════════════════════════════════════════════')
  console.log('Test Summary:')
  console.log('═══════════════════════════════════════════════════════')
  console.log('')
  console.log('If all tests passed:')
  console.log('✅ Edge Functions are deployed and working')
  console.log('✅ Rate limiting is configured')
  console.log('✅ Validation logic is correct')
  console.log('')
  console.log('Next steps:')
  console.log('1. Run setup-secure-admin.sql in Supabase Dashboard')
  console.log('2. Test the full authentication flow at /admin')
  console.log('3. Check logs: supabase functions logs admin-auth')
  console.log('4. Monitor attempts: SELECT * FROM admin_login_attempts;')
  console.log('')
}

// Запуск тестов
runTests().catch(console.error)
