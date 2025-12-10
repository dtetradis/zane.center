'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

export default function HomePage() {
  const [language, setLanguage] = useState<'en' | 'el'>('en');

  const translations = {
    en: {
      hero: {
        title: 'Welcome to',
        brandName: 'Zane Center',
        subtitle: 'The modern booking platform for beauty salons, wellness centers, and service businesses',
        description: 'Streamline your appointment scheduling with intelligent calendar management, multi-service bookings, and real-time availability tracking',
        demoButton: 'View Demo Store',
        loginButton: 'Business Login'
      },
      whoItsFor: {
        title: 'Perfect For Any Service Business',
        subtitle: "Whether you're running a salon, spa, or wellness center, Zane Center adapts to your needs",
        businesses: [
          {
            title: 'Beauty Salons',
            description: 'Hair styling, coloring, treatments, and beauty services',
            emoji: '💇‍♀️'
          },
          {
            title: 'Barbershops',
            description: 'Classic cuts, beard trims, and grooming services',
            emoji: '✂️'
          },
          {
            title: 'Spas & Wellness',
            description: 'Massages, facials, and relaxation treatments',
            emoji: '🧖‍♀️'
          },
          {
            title: 'Nail Salons',
            description: 'Manicures, pedicures, and nail art',
            emoji: '💅'
          },
          {
            title: 'Tattoo Studios',
            description: 'Tattoo and piercing appointments',
            emoji: '🎨'
          },
          {
            title: 'Fitness Centers',
            description: 'Personal training and class bookings',
            emoji: '💪'
          }
        ]
      },
      features: {
        title: 'Powerful Features',
        subtitle: 'Everything you need to manage appointments efficiently',
        items: [
          {
            title: 'Easy Booking',
            description: 'Book appointments in seconds with our intuitive calendar interface'
          },
          {
            title: 'Multi-Service Support',
            description: 'Book multiple services in one appointment with smart scheduling'
          },
          {
            title: 'Real-Time Availability',
            description: 'See available time slots instantly based on employee schedules'
          },
          {
            title: 'Secure & Private',
            description: 'Your data is protected with enterprise-grade security'
          },
          {
            title: 'Mobile Friendly',
            description: 'Book and manage appointments from any device, anywhere'
          },
          {
            title: 'Instant Confirmation',
            description: 'Get immediate booking confirmation and email notifications'
          }
        ]
      },
      howItWorks: {
        title: 'How It Works',
        subtitle: 'Book your appointment in three simple steps',
        steps: [
          {
            title: 'Choose Services',
            description: 'Browse available services and select up to 3 treatments for your appointment'
          },
          {
            title: 'Pick Date & Time',
            description: 'Select your preferred date and see available time slots in real-time'
          },
          {
            title: 'Confirm Booking',
            description: 'Enter your details and receive instant confirmation via email'
          }
        ]
      },
      cta: {
        title: 'Ready to Get Started?',
        subtitle: 'Experience the easiest way to book and manage appointments',
        button: 'Try Demo Now'
      },
      footer: {
        copyright: '© 2025 Zane Center. All rights reserved.'
      }
    },
    el: {
      hero: {
        title: 'Καλώς ήρθατε στο',
        brandName: 'Zane Center',
        subtitle: 'Η σύγχρονη πλατφόρμα κρατήσεων για κομμωτήρια, κέντρα ευεξίας και επιχειρήσεις υπηρεσιών',
        description: 'Απλοποιήστε τον προγραμματισμό των ραντεβού σας με έξυπνη διαχείριση ημερολογίου, κρατήσεις πολλαπλών υπηρεσιών και παρακολούθηση διαθεσιμότητας σε πραγματικό χρόνο',
        demoButton: 'Δείτε το Demo',
        loginButton: 'Σύνδεση Επιχείρησης'
      },
      whoItsFor: {
        title: 'Ιδανικό για Κάθε Επιχείρηση Υπηρεσιών',
        subtitle: 'Είτε διαχειρίζεστε σαλόνι, spa ή κέντρο ευεξίας, το Zane Center προσαρμόζεται στις ανάγκες σας',
        businesses: [
          {
            title: 'Κομμωτήρια',
            description: 'Κούρεμα, χτένισμα, βαφές και υπηρεσίες ομορφιάς',
            emoji: '💇‍♀️'
          },
          {
            title: 'Κουρεία',
            description: 'Κλασικά κουρέματα, περιποίηση γενειάδας και grooming',
            emoji: '✂️'
          },
          {
            title: 'Spa & Ευεξία',
            description: 'Μασάζ, περιποίηση προσώπου και θεραπείες χαλάρωσης',
            emoji: '🧖‍♀️'
          },
          {
            title: 'Νυχοπλαστεία',
            description: 'Μανικιούρ, πεντικιούρ και nail art',
            emoji: '💅'
          },
          {
            title: 'Tattoo Studios',
            description: 'Ραντεβού για τατουάζ και piercing',
            emoji: '🎨'
          },
          {
            title: 'Γυμναστήρια',
            description: 'Προσωπική εκγύμναση και κρατήσεις μαθημάτων',
            emoji: '💪'
          }
        ]
      },
      features: {
        title: 'Ισχυρά Χαρακτηριστικά',
        subtitle: 'Όλα όσα χρειάζεστε για αποτελεσματική διαχείριση ραντεβού',
        items: [
          {
            title: 'Εύκολη Κράτηση',
            description: 'Κλείστε ραντεβού σε δευτερόλεπτα με το διαισθητικό μας ημερολόγιο'
          },
          {
            title: 'Πολλαπλές Υπηρεσίες',
            description: 'Κλείστε πολλές υπηρεσίες σε ένα ραντεβού με έξυπνο προγραμματισμό'
          },
          {
            title: 'Διαθεσιμότητα Πραγματικού Χρόνου',
            description: 'Δείτε τις διαθέσιμες ώρες αμέσως με βάση τα προγράμματα των εργαζομένων'
          },
          {
            title: 'Ασφάλεια & Απόρρητο',
            description: 'Τα δεδομένα σας προστατεύονται με ασφάλεια επιχειρηματικού επιπέδου'
          },
          {
            title: 'Φιλικό σε Κινητά',
            description: 'Κλείστε και διαχειριστείτε ραντεβού από οποιαδήποτε συσκευή, οπουδήποτε'
          },
          {
            title: 'Άμεση Επιβεβαίωση',
            description: 'Λάβετε άμεση επιβεβαίωση κράτησης και ειδοποιήσεις email'
          }
        ]
      },
      howItWorks: {
        title: 'Πώς Λειτουργεί',
        subtitle: 'Κλείστε το ραντεβού σας σε τρία απλά βήματα',
        steps: [
          {
            title: 'Επιλέξτε Υπηρεσίες',
            description: 'Περιηγηθείτε στις διαθέσιμες υπηρεσίες και επιλέξτε έως 3 θεραπείες για το ραντεβού σας'
          },
          {
            title: 'Επιλέξτε Ημερομηνία & Ώρα',
            description: 'Επιλέξτε την προτιμώμενη ημερομηνία σας και δείτε τις διαθέσιμες ώρες σε πραγματικό χρόνο'
          },
          {
            title: 'Επιβεβαιώστε την Κράτηση',
            description: 'Εισάγετε τα στοιχεία σας και λάβετε άμεση επιβεβαίωση μέσω email'
          }
        ]
      },
      cta: {
        title: 'Έτοιμοι να Ξεκινήσετε;',
        subtitle: 'Ζήστε τον πιο εύκολο τρόπο κράτησης και διαχείρισης ραντεβού',
        button: 'Δοκιμάστε το Demo'
      },
      footer: {
        copyright: '© 2025 Zane Center. Με επιφύλαξη παντός δικαιώματος.'
      }
    }
  };

  const t = translations[language];

  const featureIcons = [
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    'M13 10V3L4 14h7v7l9-11h-7z'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary">
      {/* Language Toggle - Fixed in top right */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-surface border border-border rounded-lg p-1 flex gap-1 shadow-lg">
          <button
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              language === 'en'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('el')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              language === 'el'
                ? 'bg-primary text-white'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            ΕΛ
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-text mb-6">
              {t.hero.title} <span className="text-primary">{t.hero.brandName}</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-8 leading-relaxed">
              {t.hero.subtitle}
            </p>
            <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto">
              {t.hero.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/test-salon">
                <Button size="lg" className="text-lg px-8 py-6">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {t.hero.demoButton}
                </Button>
              </Link>
              <Link href="/test-salon/dashboard/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {t.hero.loginButton}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 bg-surface-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              {t.whoItsFor.title}
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              {t.whoItsFor.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {t.whoItsFor.businesses.map((business, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-4">{business.emoji}</div>
                  <h3 className="text-2xl font-bold text-text mb-3">{business.title}</h3>
                  <p className="text-text-secondary">{business.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              {t.features.title}
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {t.features.items.map((feature, index) => (
              <div key={index} className="bg-surface rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={featureIcons[index]} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-surface-secondary/30 to-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              {t.howItWorks.title}
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              {t.howItWorks.subtitle}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {t.howItWorks.steps.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-bold text-text mb-3">{step.title}</h3>
                  <p className="text-text-secondary">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-primary-hover rounded-2xl p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t.cta.title}
            </h2>
            <p className="text-xl text-white/90 mb-8">
              {t.cta.subtitle}
            </p>
            <Link href="/test-salon">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6">
                {t.cta.button}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-text-secondary">
          <p>{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
