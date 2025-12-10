const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hhywaddenwmiktdtnxtz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const storeId = '3f4fd451-f2e0-4064-b62d-b59d589c0af1';

const services = [
  // Barber Services
  {
    service_name: 'Κούρεμα Ανδρικό',
    description: 'Κλασικό ανδρικό κούρεμα με ψαλίδι και ξυριστική μηχανή',
    profession: 'Barber',
    category: 'Κούρεμα',
    price: 15,
    duration: 30,
    id_store: storeId,
    index: 0
  },
  {
    service_name: 'Κούρεμα & Ξύρισμα',
    description: 'Πλήρες κούρεμα με παραδοσιακό ξύρισμα',
    profession: 'Barber',
    category: 'Κούρεμα',
    price: 25,
    duration: 45,
    id_store: storeId,
    index: 1
  },
  {
    service_name: 'Ξύρισμα με Ξυράφι',
    description: 'Παραδοσιακό ξύρισμα με ξυράφι και καυτές πετσέτες',
    profession: 'Barber',
    category: 'Ξύρισμα',
    price: 15,
    duration: 25,
    id_store: storeId,
    index: 2
  },
  {
    service_name: 'Περιποίηση Γενιών',
    description: 'Κόψιμο και περιποίηση γενιών',
    profession: 'Barber',
    category: 'Γένια',
    price: 12,
    duration: 20,
    id_store: storeId,
    index: 3
  },
  {
    service_name: 'Κούρεμα Παιδικό',
    description: 'Κούρεμα για παιδιά έως 12 ετών',
    profession: 'Barber',
    category: 'Κούρεμα',
    price: 12,
    duration: 25,
    id_store: storeId,
    index: 4
  },
  {
    service_name: 'Ανοιχτόχρωμα Μαλλιά',
    description: 'Αλλαγή χρώματος ή highlights',
    profession: 'Barber',
    category: 'Χρωματισμός',
    price: 35,
    duration: 60,
    id_store: storeId,
    index: 5
  },

  // Nail Technician Services
  {
    service_name: 'Manicure Κλασικό',
    description: 'Καθαρισμός, λιμάρισμα και βάψιμο νυχιών χεριών',
    profession: 'Nail Technician',
    category: 'Manicure',
    price: 20,
    duration: 45,
    id_store: storeId,
    index: 6
  },
  {
    service_name: 'Manicure με Gel',
    description: 'Ημιμόνιμο βερνίκι gel που διαρκεί έως 3 εβδομάδες',
    profession: 'Nail Technician',
    category: 'Manicure',
    price: 30,
    duration: 60,
    id_store: storeId,
    index: 7
  },
  {
    service_name: 'Pedicure Κλασικό',
    description: 'Καθαρισμός, λιμάρισμα και βάψιμο νυχιών ποδιών',
    profession: 'Nail Technician',
    category: 'Pedicure',
    price: 25,
    duration: 50,
    id_store: storeId,
    index: 8
  },
  {
    service_name: 'Pedicure με Gel',
    description: 'Ημιμόνιμο βερνίκι gel για τα νύχια ποδιών',
    profession: 'Nail Technician',
    category: 'Pedicure',
    price: 35,
    duration: 65,
    id_store: storeId,
    index: 9
  },
  {
    service_name: 'Τεχνητά Νύχια',
    description: 'Εφαρμογή τεχνητών νυχιών με ακρυλικό ή gel',
    profession: 'Nail Technician',
    category: 'Τεχνητά Νύχια',
    price: 45,
    duration: 90,
    id_store: storeId,
    index: 10
  },
  {
    service_name: 'Συντήρηση Τεχνητών Νυχιών',
    description: 'Γέμισμα και επιδιόρθωση τεχνητών νυχιών',
    profession: 'Nail Technician',
    category: 'Τεχνητά Νύχια',
    price: 35,
    duration: 60,
    id_store: storeId,
    index: 11
  },
  {
    service_name: 'Αφαίρεση Gel',
    description: 'Ασφαλής αφαίρεση ημιμόνιμου βερνικιού',
    profession: 'Nail Technician',
    category: 'Manicure',
    price: 10,
    duration: 20,
    id_store: storeId,
    index: 12
  },
  {
    service_name: 'Nail Art Απλό',
    description: 'Απλό σχέδιο σε 2-3 νύχια',
    profession: 'Nail Technician',
    category: 'Nail Art',
    price: 15,
    duration: 30,
    id_store: storeId,
    index: 13
  },
  {
    service_name: 'Nail Art Πολύπλοκο',
    description: 'Σύνθετο σχέδιο με πολλές λεπτομέρειες',
    profession: 'Nail Technician',
    category: 'Nail Art',
    price: 30,
    duration: 60,
    id_store: storeId,
    index: 14
  }
];

async function addServices() {
  console.log('Adding services to the database...\n');

  for (const service of services) {
    const { data, error } = await supabase
      .from('services')
      .insert([service])
      .select();

    if (error) {
      console.log(`❌ Error adding ${service.service_name}: ${error.message}`);
    } else {
      console.log(`✅ Added: ${service.service_name} (${service.profession}) - €${service.price}, ${service.duration} min`);
    }
  }

  console.log('\n✨ Services added successfully!');

  // Show summary
  const barberServices = services.filter(s => s.profession === 'Barber');
  const nailServices = services.filter(s => s.profession === 'Nail Technician');

  console.log('\n=== SUMMARY ===');
  console.log(`Barber Services: ${barberServices.length}`);
  console.log(`Nail Technician Services: ${nailServices.length}`);
  console.log(`Total Services Added: ${services.length}`);
}

addServices();
