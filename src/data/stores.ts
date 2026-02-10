export interface StoreLocation {
  id: string;       // e.g. "60", "100", "123"
  number: string;   // Display number
  name: string;     // Full display name
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  hours?: string;
  type: 'store' | 'wine-spirits';
}

export const STORE_LOCATIONS: StoreLocation[] = [
  // Alabama
  {
    id: '60',
    number: '#60',
    name: 'Keith Superstore #60',
    address: '13515 Moffett Rd',
    city: 'Wilmer',
    state: 'AL',
    zip: '36587',
    phone: '(251) 649-6544',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Ellisville
  {
    id: '100',
    number: '#100',
    name: 'Keith Superstore #100',
    address: '304 Hill St.',
    city: 'Ellisville',
    state: 'MS',
    zip: '39437',
    phone: '(601) 477-9990',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '105',
    number: '#105',
    name: 'Keith Superstore #105',
    address: '5213 Hwy 11 N.',
    city: 'Ellisville',
    state: 'MS',
    zip: '39437',
    phone: '(601) 425-3085',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Purvis
  {
    id: '123',
    number: '#123',
    name: 'Keith Superstore #123',
    address: '361 Hwy 589',
    city: 'Purvis',
    state: 'MS',
    zip: '39475',
    phone: '(601) 744-0660',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '120',
    number: '#120',
    name: 'Keith Superstore #120',
    address: '5812 Hwy 11',
    city: 'Purvis',
    state: 'MS',
    zip: '39475',
    phone: '(601) 794-2249',
    hours: 'Mon–Sun 5:00am–10:00pm',
    type: 'store',
  },
  {
    id: '122',
    number: '#122',
    name: 'Keith Superstore #122',
    address: '5791 Hwy 11',
    city: 'Purvis',
    state: 'MS',
    zip: '39475',
    phone: '(601) 794-0422',
    hours: 'Mon–Sun 5:00am–10:00pm',
    type: 'store',
  },

  // Mississippi – Hattiesburg
  {
    id: '157',
    number: '#157',
    name: 'Keith Superstore #157',
    address: '2462 US Hwy 49',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39401',
    phone: '(601) 336-1340',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '135',
    number: '#135',
    name: 'Keith Superstore #135',
    address: '5331 Old Hwy 11',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39402',
    phone: '(601) 271-8711',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '137',
    number: '#137',
    name: 'Keith Superstore #137',
    address: '5170 W. 4th St.',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39401',
    phone: '(601) 296-6008',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '150',
    number: '#150',
    name: 'Keith Superstore #150',
    address: '6750 Hwy 49',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39402',
    phone: '(601) 271-8400',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '151',
    number: '#151',
    name: 'Keith Superstore #151',
    address: '7276 Hwy 49',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39402',
    phone: '(601) 296-6761',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '173',
    number: '#173',
    name: 'Keith Superstore #173',
    address: '1858 Evelyn Gandy Pkwy',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39401',
    phone: '(601) 583-4485',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – Lucedale
  {
    id: '80',
    number: '#80',
    name: 'Keith Superstore #80',
    address: '6239 Hwy 98',
    city: 'Lucedale',
    state: 'MS',
    zip: '39452',
    phone: '(601) 947-7520',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },
  {
    id: '81',
    number: '#81',
    name: 'Keith Superstore #81',
    address: '7292 Hwy 63 S.',
    city: 'Lucedale',
    state: 'MS',
    zip: '39452',
    phone: '(601) 947-8120',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Saucier
  {
    id: '107',
    number: '#107',
    name: 'Keith Superstore #107',
    address: '26181 Hwy 49 S.',
    city: 'Saucier',
    state: 'MS',
    zip: '39574',
    phone: '(228) 832-0298',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Collins
  {
    id: '127',
    number: '#127',
    name: 'Keith Superstore #127',
    address: '3030 Hwy 49',
    city: 'Collins',
    state: 'MS',
    zip: '39428',
    phone: '(601) 909-9133',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Wiggins
  {
    id: '160',
    number: '#160',
    name: 'Keith Superstore #160',
    address: '114 Magnolia Dr.',
    city: 'Wiggins',
    state: 'MS',
    zip: '39577',
    phone: '(601) 528-9002',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },
  {
    id: '161',
    number: '#161',
    name: 'Keith Superstore #161',
    address: '3333 Hwy 49',
    city: 'Wiggins',
    state: 'MS',
    zip: '39577',
    phone: '(601) 928-7826',
    hours: 'Mon–Sun 5:00am–10:00pm',
    type: 'store',
  },
  {
    id: '91',
    number: '#91',
    name: 'Keith Superstore #91',
    address: '1220 W. Central Ave.',
    city: 'Wiggins',
    state: 'MS',
    zip: '39577',
    phone: '(601) 928-9403',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Moss Point
  {
    id: '82',
    number: '#82',
    name: 'Keith Superstore #82',
    address: '21000 Hwy 613',
    city: 'Moss Point',
    state: 'MS',
    zip: '39562',
    phone: '(228) 588-2134',
    hours: 'Mon–Sun 4:00am–12:00am',
    type: 'store',
  },
  {
    id: '85',
    number: '#85',
    name: 'Keith Superstore #85',
    address: '6820 Hwy 613',
    city: 'Moss Point',
    state: 'MS',
    zip: '39563',
    phone: '(228) 474-2556',
    hours: 'Mon–Thurs 3:00am–11:00pm, Fri 3:00am–12:00am, Sat 5:00am–12:00am, Sun 5:00am–11:00pm',
    type: 'store',
  },
  {
    id: '86',
    number: '#86',
    name: 'Keith Superstore #86',
    address: '6718 Hwy 63',
    city: 'Moss Point',
    state: 'MS',
    zip: '39563',
    phone: '(228) 474-0004',
    hours: 'Mon–Sun 4:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Long Beach
  {
    id: '108',
    number: '#108',
    name: 'Keith Superstore #108',
    address: '19000 28th St.',
    city: 'Long Beach',
    state: 'MS',
    zip: '39560',
    phone: '(228) 575-6822',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Columbia
  {
    id: '130',
    number: '#130',
    name: 'Keith Superstore #130',
    address: '1475 Hwy 98 E.',
    city: 'Columbia',
    state: 'MS',
    zip: '39429',
    phone: '(601) 736-6662',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Pass Christian
  {
    id: '109',
    number: '#109',
    name: 'Keith Superstore #109',
    address: '102 E Beach Blvd',
    city: 'Pass Christian',
    state: 'MS',
    zip: '39571',
    phone: '(228) 452-5651',
    hours: 'Mon–Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Gautier
  {
    id: '112',
    number: '#112',
    name: 'Keith Superstore #112',
    address: '819 Hwy 90',
    city: 'Gautier',
    state: 'MS',
    zip: '39553',
    phone: '(228) 497-9687',
    hours: 'Mon–Fri 3:00am–11:00pm, Sat 4:00am–12:00am, Sun 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Petal
  {
    id: '175',
    number: '#175',
    name: 'Keith Superstore #175',
    address: '101 Carterville Rd',
    city: 'Petal',
    state: 'MS',
    zip: '39465',
    phone: '(601) 584-8665',
    hours: 'Mon–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Vancleave
  {
    id: '88',
    number: '#88',
    name: 'Keith Superstore #88',
    address: '10909 Hwy 57',
    city: 'Vancleave',
    state: 'MS',
    zip: '39565',
    phone: '(228) 826-9115',
    hours: 'Mon–Sun 4:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Moselle
  {
    id: '59',
    number: '#59',
    name: 'Keith Superstore #59',
    address: '59 Moselle Seminary Rd.',
    city: 'Moselle',
    state: 'MS',
    zip: '39459',
    phone: '(601) 582-8330',
    hours: 'Mon–Sun 4:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – Mount Olive
  {
    id: '140',
    number: '#140',
    name: 'Keith Superstore #140',
    address: '1196 Rock Hill Rd.',
    city: 'Mount Olive',
    state: 'MS',
    zip: '39119',
    phone: '(601) 797-4545',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – Bay St. Louis
  {
    id: '183',
    number: '#183',
    name: 'Keith Superstore #183',
    address: '701 Hwy 90',
    city: 'Bay St. Louis',
    state: 'MS',
    zip: '39520',
    phone: '(251) 649-6544',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },
  {
    id: '184',
    number: '#184',
    name: 'Keith Superstore #184',
    address: '4955 Hwy 90',
    city: 'Bay St. Louis',
    state: 'MS',
    zip: '39520',
    phone: '(228) 466-4336',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – Ocean Springs
  {
    id: '89',
    number: '#89',
    name: 'Keith Superstore #89',
    address: '7501 Washington Ave',
    city: 'Ocean Springs',
    state: 'MS',
    zip: '39564',
    phone: '(228) 872-1955',
    hours: 'Open 24/7',
    type: 'store',
  },

  // Mississippi – Bay Springs
  {
    id: '117',
    number: '#117',
    name: 'Keith Superstore #117',
    address: '2675 Hwy 15',
    city: 'Bay Springs',
    state: 'MS',
    zip: '39422',
    phone: '(601) 764-4580',
    type: 'store',
  },

  // Mississippi – Seminary
  {
    id: '125',
    number: '#125',
    name: 'Keith Superstore #125',
    address: '2078 US Hwy 49',
    city: 'Seminary',
    state: 'MS',
    zip: '39479',
    phone: '(601) 722-4323',
    hours: 'Mon–Sun 5:00am–10:00pm',
    type: 'store',
  },

  // Mississippi – Sumrall
  {
    id: '155',
    number: '#155',
    name: 'Keith Superstore #155',
    address: '8431 Hwy 98',
    city: 'Sumrall',
    state: 'MS',
    zip: '39482',
    phone: '(601) 296-4721',
    hours: 'Sun–Thurs 5:00am–9:00pm, Fri–Sat 5:00am–10:00pm',
    type: 'store',
  },

  // Mississippi – Waveland
  {
    id: '182',
    number: '#182',
    name: 'Keith Superstore #182',
    address: '10513 Hwy 603',
    city: 'Waveland',
    state: 'MS',
    zip: '39576',
    phone: '(228) 466-4494',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – Picayune
  {
    id: '192',
    number: '#192',
    name: 'Keith Superstore #192',
    address: '1405 Hwy 43 N.',
    city: 'Picayune',
    state: 'MS',
    zip: '39466',
    phone: '(601) 798-9554',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Carriere
  {
    id: '194',
    number: '#194',
    name: 'Keith Superstore #194',
    address: '498 W. Union Rd.',
    city: 'Carriere',
    state: 'MS',
    zip: '39426',
    phone: '(601) 889-0394',
    hours: 'Open 24/7',
    type: 'store',
  },

  // Mississippi – Poplarville
  {
    id: '196',
    number: '#196',
    name: 'Keith Superstore #196',
    address: '4670 Hwy 53',
    city: 'Poplarville',
    state: 'MS',
    zip: '39470',
    phone: '(601) 403-8290',
    hours: 'Sun–Thurs 5:00am–11:00pm, Fri–Sat 5:00am–12:00am',
    type: 'store',
  },

  // Mississippi – Lumberton
  {
    id: '185',
    number: '#185',
    name: 'Keith Superstore #185',
    address: '918 E. Main Ave',
    city: 'Lumberton',
    state: 'MS',
    zip: '39455',
    phone: '(601) 796-2780',
    hours: 'Mon–Sun 5:00am–11:00pm',
    type: 'store',
  },

  // Mississippi – #90 (no address listed)
  {
    id: '90',
    number: '#90',
    name: 'Keith Superstore #90',
    address: '',
    city: '',
    state: 'MS',
    zip: '',
    phone: '(228) 392-9084',
    hours: 'Open 24/7',
    type: 'store',
  },

  // Wine & Spirits
  {
    id: 'wine-118',
    number: '#118',
    name: 'Bay Wine and Spirits #118',
    address: '2675 Hwy 15',
    city: 'Bay Springs',
    state: 'MS',
    zip: '39422',
    phone: '(601) 764-4583',
    hours: 'Mon–Sat 10:00am–10:00pm, Sun Closed',
    type: 'wine-spirits',
  },
  {
    id: 'lamp-post',
    number: '',
    name: 'Lamp Post Liquor',
    address: '5170 W. 4th St.',
    city: 'Hattiesburg',
    state: 'MS',
    zip: '39401',
    phone: '(601) 582-0351',
    hours: 'Mon–Sat 10:00am–10:00pm, Sun Closed',
    type: 'wine-spirits',
  },
  {
    id: 'redds-10',
    number: '#10',
    name: "REDD'S #10",
    address: '906 Schillinger Rd., Suite A',
    city: 'Mobile',
    state: 'AL',
    zip: '36695',
    phone: '',
    type: 'wine-spirits',
  },
  {
    id: 'redds-7',
    number: '#7',
    name: "REDD'S #7",
    address: '10800 Dauphin Island Pkwy',
    city: 'Theodore',
    state: 'AL',
    zip: '36582',
    phone: '(601) 336-1318',
    hours: 'Mon–Sat 7:00am–10:00pm, Sun Closed',
    type: 'wine-spirits',
  },
];

export const STORE_LOCATIONS_BY_ID = Object.fromEntries(
  STORE_LOCATIONS.map((s) => [s.id, s])
);

export function getStoreById(id: string): StoreLocation | undefined {
  return STORE_LOCATIONS_BY_ID[id];
}

export function getStoreDisplayName(id: string): string {
  const store = getStoreById(id);
  if (!store) return 'Unknown Store';
  return `${store.name} — ${store.city}, ${store.state}`;
}

// Group stores by state/city for the picker UI
export const STORES_BY_STATE: Record<string, StoreLocation[]> = {};
for (const store of STORE_LOCATIONS) {
  const key = store.state;
  if (!STORES_BY_STATE[key]) STORES_BY_STATE[key] = [];
  STORES_BY_STATE[key].push(store);
}
