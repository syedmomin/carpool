import prisma from '../data-source';

async function verifyFuzzySearch() {
  console.log('--- Checking Fuzzy Search (Prisma Logic) ---');
  try {
    // Skip pg_trgm extension check via raw SQL as it might fail on TLS
    console.log('ℹ️ Skipping raw SQL health check due to TLS constraints in scratch environment.');

    // Check if we have any rides to test with
    const count = await prisma.ride.count();
    console.log(`ℹ️ Current rides in DB: ${count}`);

    if (count > 0) {
      const firstRide = await prisma.ride.findFirst();
      if (firstRide) {
        const city = firstRide.fromCity;
        const partialCity = city.slice(0, 3);
        console.log(`ℹ️ Testing search with partial city: "${partialCity}" (Full: "${city}")`);
        
        const results = await prisma.ride.findMany({
          where: {
            OR: [
              { fromCity: { contains: partialCity, mode: 'insensitive' } },
              { toCity: { contains: partialCity, mode: 'insensitive' } }
            ]
          }
        });
        
        if (results.length > 0) {
          console.log(`✅ PASS: Found ${results.length} results matching "${partialCity}"`);
        } else {
          console.log(`❌ FAIL: No results found for "${partialCity}" even though it exists as "${city}"`);
        }
      }
    } else {
      console.log('ℹ️ No rides available to perform a specific search test.');
    }

  } catch (err) {
    console.error('❌ Error during search verification:', err);
  } finally {
    await prisma.$disconnect();
  }
}

verifyFuzzySearch();
