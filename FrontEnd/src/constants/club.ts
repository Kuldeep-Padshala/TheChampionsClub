/**
 * CLUB_INFO — Single source of truth for all club contact/identity information.
 * Change values here and they update everywhere on the site automatically.
 */
export const CLUB_INFO = {
  name:       'The Champions Club',
  shortName:  'Champions Club',
  tagline:    'Where Champions Are Made',
  address:    '12, Sports Complex Road, Koramangala, Bengaluru — 560034',
  phone:      '+91 80 4567 8900',
  email:      'hello@championsclub.in',
  hours:      'Mon–Fri: 6 AM – 10 PM  |  Sat–Sun: 6 AM – 11 PM',
  mapUrl:     'https://maps.google.com/?q=Koramangala+Bengaluru',
  social: {
    instagram: 'https://instagram.com/championsclub',
    twitter:   'https://twitter.com/championsclub',
    facebook:  'https://facebook.com/championsclub',
  },
  siteTitle:  'The Champions Club — Premium Sports & Fitness Club',
} as const;
