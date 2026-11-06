// Swollen Forge Labs product list data. Edit prices, names and descriptions here.
const CATEGORIES = [
 {
  "id": "injectables",
  "name": "Injectables",
  "blurb": "Sealed 10 mL multi-dose vials."
 },
 {
  "id": "orals",
  "name": "Orals",
  "blurb": "Tablets in sealed foil pouches."
 },
 {
  "id": "sarms",
  "name": "SARMs",
  "blurb": "Selective androgen receptor modulators in tablet form."
 },
 {
  "id": "pct",
  "name": "PCT",
  "blurb": "Post-cycle tablets."
 },
 {
  "id": "hcg",
  "name": "HCG",
  "blurb": "Lyophilized hCG with bacteriostatic water."
 },
 {
  "id": "support",
  "name": "Support",
  "blurb": "Ancillaries and support compounds."
 }
];
const PRODUCTS = [
 {
  "id": "p1",
  "name": "Test Propionate 100",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p1.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Propionate"
   ],
   [
    "Strength",
    "100 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Pale amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "100 mg per mL",
  "desc": [
   "Testosterone propionate is a short-ester form of testosterone with a fast release profile.",
   "Strength is 100 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone propionate is a short-ester form of testosterone with a fast release profile.",
  "related": [
   "p2",
   "p3",
   "p4"
  ]
 },
 {
  "id": "p2",
  "name": "Testosterone Enanthate 250",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p2.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Enanthate"
   ],
   [
    "Strength",
    "250 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "250 mg per mL",
  "desc": [
   "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
   "Strength is 250 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
  "related": [
   "p1",
   "p3",
   "p4"
  ]
 },
 {
  "id": "p3",
  "name": "Testosterone Enanthate 300",
  "cat": "injectables",
  "price": 60,
  "img": "assets/img/products/sf-p3.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Enanthate"
   ],
   [
    "Strength",
    "300 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "300 mg per mL",
  "desc": [
   "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
   "Strength is 300 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
  "related": [
   "p2",
   "p4",
   "p5"
  ]
 },
 {
  "id": "p4",
  "name": "Testosterone Enanthate 500",
  "cat": "injectables",
  "price": 65,
  "img": "assets/img/products/sf-p4.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Enanthate"
   ],
   [
    "Strength",
    "500 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "500 mg per mL",
  "desc": [
   "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
   "Strength is 500 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone enanthate is a long-ester form of testosterone known for a slow, steady release profile.",
  "related": [
   "p3",
   "p5",
   "p6"
  ]
 },
 {
  "id": "p5",
  "name": "Testosterone Cypionate 250",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p5.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Cypionate"
   ],
   [
    "Strength",
    "250 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "250 mg per mL",
  "desc": [
   "Testosterone cypionate is a long-ester form of testosterone with a release profile close to enanthate.",
   "Strength is 250 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone cypionate is a long-ester form of testosterone with a release profile close to enanthate.",
  "related": [
   "p4",
   "p6",
   "p7"
  ]
 },
 {
  "id": "p6",
  "name": "Sustanon 250",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p6.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Blend (Propionate, Phenylpropionate, Isocaproate, Decanoate)"
   ],
   [
    "Strength",
    "250 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "250 mg per mL",
  "desc": [
   "Sustanon 250 is a four-ester testosterone blend (propionate, phenylpropionate, isocaproate and decanoate) that mixes fast and slow release.",
   "Strength is 250 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Sustanon 250 is a four-ester testosterone blend (propionate, phenylpropionate, isocaproate and decanoate) that mixes fast and slow release.",
  "related": [
   "p5",
   "p7",
   "p8"
  ]
 },
 {
  "id": "p7",
  "name": "T400",
  "cat": "injectables",
  "price": 60,
  "img": "assets/img/products/sf-p7.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Blend (Enanthate, Cypionate, Undecanoate)"
   ],
   [
    "Strength",
    "400 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "400 mg per mL",
  "desc": [
   "T400 is a three-ester testosterone blend (enanthate, cypionate and undecanoate) in a higher-concentration vial.",
   "Strength is 400 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "T400 is a three-ester testosterone blend (enanthate, cypionate and undecanoate) in a higher-concentration vial.",
  "related": [
   "p6",
   "p8",
   "p9"
  ]
 },
 {
  "id": "p8",
  "name": "Deca 300",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p8.jpg",
  "specs": [
   [
    "Compound",
    "Nandrolone Decanoate"
   ],
   [
    "Strength",
    "300 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "300 mg per mL",
  "desc": [
   "Nandrolone decanoate is a long-acting ester of nandrolone, a 19-nortestosterone derivative.",
   "Strength is 300 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Nandrolone decanoate is a long-acting ester of nandrolone, a 19-nortestosterone derivative.",
  "related": [
   "p7",
   "p9",
   "p10"
  ]
 },
 {
  "id": "p9",
  "name": "NPP 150",
  "cat": "injectables",
  "price": 60,
  "img": "assets/img/products/sf-p9.jpg",
  "specs": [
   [
    "Compound",
    "Nandrolone Phenylpropionate"
   ],
   [
    "Strength",
    "150 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "150 mg per mL",
  "desc": [
   "Nandrolone phenylpropionate is a faster-acting ester of nandrolone, a 19-nortestosterone derivative.",
   "Strength is 150 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Nandrolone phenylpropionate is a faster-acting ester of nandrolone, a 19-nortestosterone derivative.",
  "related": [
   "p8",
   "p10",
   "p11"
  ]
 },
 {
  "id": "p10",
  "name": "Equipoise (EQ) 300",
  "cat": "injectables",
  "price": 60,
  "img": "assets/img/products/sf-p10.jpg",
  "specs": [
   [
    "Compound",
    "Boldenone Undecylenate"
   ],
   [
    "Strength",
    "300 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "300 mg per mL",
  "desc": [
   "Boldenone undecylenate is a long-acting ester of boldenone, a testosterone derivative.",
   "Strength is 300 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Boldenone undecylenate is a long-acting ester of boldenone, a testosterone derivative.",
  "related": [
   "p9",
   "p11",
   "p12"
  ]
 },
 {
  "id": "p11",
  "name": "Trenbolone Enanthate 200",
  "cat": "injectables",
  "price": 70,
  "img": "assets/img/products/sf-p11.jpg",
  "specs": [
   [
    "Compound",
    "Trenbolone Enanthate"
   ],
   [
    "Strength",
    "200 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Dark amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "200 mg per mL",
  "desc": [
   "Trenbolone enanthate is a long-acting ester of trenbolone, a potent synthetic androgen.",
   "Strength is 200 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Trenbolone enanthate is a long-acting ester of trenbolone, a potent synthetic androgen.",
  "related": [
   "p10",
   "p12",
   "p13"
  ]
 },
 {
  "id": "p12",
  "name": "Trenbolone Acetate 100",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p12.jpg",
  "specs": [
   [
    "Compound",
    "Trenbolone Acetate"
   ],
   [
    "Strength",
    "100 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Dark amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "100 mg per mL",
  "desc": [
   "Trenbolone acetate is a short-acting ester of trenbolone, a potent synthetic androgen.",
   "Strength is 100 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Trenbolone acetate is a short-acting ester of trenbolone, a potent synthetic androgen.",
  "related": [
   "p11",
   "p13",
   "p14"
  ]
 },
 {
  "id": "p13",
  "name": "TNT Blend 400",
  "cat": "injectables",
  "price": 60,
  "img": "assets/img/products/sf-p13.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone Enanthate (250 mg) + Trenbolone Enanthate (150 mg)"
   ],
   [
    "Strength",
    "400 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Deep amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "400 mg per mL",
  "desc": [
   "TNT Blend combines testosterone enanthate (250 mg) and trenbolone enanthate (150 mg) in one vial.",
   "Strength is 400 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "TNT Blend combines testosterone enanthate (250 mg) and trenbolone enanthate (150 mg) in one vial.",
  "related": [
   "p12",
   "p14",
   "p15"
  ]
 },
 {
  "id": "p14",
  "name": "Masteron Propionate 150",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p14.jpg",
  "specs": [
   [
    "Compound",
    "Drostanolone Propionate"
   ],
   [
    "Strength",
    "150 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Pale amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "150 mg per mL",
  "desc": [
   "Drostanolone propionate is a short-ester form of drostanolone, a DHT-derived androgen.",
   "Strength is 150 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Drostanolone propionate is a short-ester form of drostanolone, a DHT-derived androgen.",
  "related": [
   "p13",
   "p15",
   "p16"
  ]
 },
 {
  "id": "p15",
  "name": "Masteron Enanthate 200",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p15.jpg",
  "specs": [
   [
    "Compound",
    "Drostanolone Enanthate"
   ],
   [
    "Strength",
    "200 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "200 mg per mL",
  "desc": [
   "Drostanolone enanthate is a long-ester form of drostanolone, a DHT-derived androgen.",
   "Strength is 200 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Drostanolone enanthate is a long-ester form of drostanolone, a DHT-derived androgen.",
  "related": [
   "p14",
   "p16",
   "p17"
  ]
 },
 {
  "id": "p16",
  "name": "Primobolan 100",
  "cat": "injectables",
  "price": 70,
  "img": "assets/img/products/sf-p16.jpg",
  "specs": [
   [
    "Compound",
    "Methenolone Enanthate"
   ],
   [
    "Strength",
    "100 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Pale amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "100 mg per mL",
  "desc": [
   "Methenolone enanthate is a long-ester form of methenolone, a DHT-derived androgen.",
   "Strength is 100 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Methenolone enanthate is a long-ester form of methenolone, a DHT-derived androgen.",
  "related": [
   "p15",
   "p17",
   "p18"
  ]
 },
 {
  "id": "p17",
  "name": "Primobolan 200",
  "cat": "injectables",
  "price": 120,
  "img": "assets/img/products/sf-p17.jpg",
  "specs": [
   [
    "Compound",
    "Methenolone Enanthate"
   ],
   [
    "Strength",
    "200 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Pale amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "200 mg per mL",
  "desc": [
   "Methenolone enanthate is a long-ester form of methenolone, a DHT-derived androgen.",
   "Strength is 200 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Methenolone enanthate is a long-ester form of methenolone, a DHT-derived androgen.",
  "related": [
   "p16",
   "p18",
   "p19"
  ]
 },
 {
  "id": "p18",
  "name": "Winstrol 50 (Injectable)",
  "cat": "injectables",
  "price": 81,
  "img": "assets/img/products/sf-p18.jpg",
  "specs": [
   [
    "Compound",
    "Stanozolol"
   ],
   [
    "Strength",
    "50 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Milky suspension"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "50 mg per mL",
  "desc": [
   "Stanozolol is a DHT-derived synthetic androgen, supplied here as an aqueous suspension.",
   "Strength is 50 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Shake the vial well before use; the contents settle.",
   "Store at room temperature, away from direct light. Do not freeze.",
   "Keep the vial sealed and upright."
  ],
  "short": "Stanozolol is a DHT-derived synthetic androgen, supplied here as an aqueous suspension.",
  "related": [
   "p17",
   "p19",
   "p64"
  ]
 },
 {
  "id": "p19",
  "name": "Superdrol 40 (Injectable)",
  "cat": "injectables",
  "price": 81,
  "img": "assets/img/products/sf-p19.jpg",
  "specs": [
   [
    "Compound",
    "Methasterone"
   ],
   [
    "Strength",
    "40 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Pale amber oil"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "40 mg per mL",
  "desc": [
   "Methasterone is a DHT-derived synthetic androgen, supplied here in an oil-based vial.",
   "Strength is 40 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Store at room temperature, away from direct light and heat.",
   "Do not refrigerate; oil-based solutions can thicken in the cold.",
   "Keep the vial sealed and upright."
  ],
  "short": "Methasterone is a DHT-derived synthetic androgen, supplied here in an oil-based vial.",
  "related": [
   "p17",
   "p18",
   "p64"
  ]
 },
 {
  "id": "p20",
  "name": "Anavar 5",
  "cat": "orals",
  "price": 60,
  "img": "assets/img/products/sf-p20.jpg",
  "specs": [
   [
    "Compound",
    "Oxandrolone"
   ],
   [
    "Strength",
    "5 mg per tablet"
   ],
   [
    "Format",
    "200 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "200 tablets, foil pouch",
  "strength": "5 mg per tablet",
  "desc": [
   "Oxandrolone is a DHT-derived oral androgen.",
   "Strength is 5 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Oxandrolone is a DHT-derived oral androgen.",
  "related": [
   "p21",
   "p22",
   "p23"
  ]
 },
 {
  "id": "p21",
  "name": "Anavar 10",
  "cat": "orals",
  "price": 50,
  "img": "assets/img/products/sf-p21.jpg",
  "specs": [
   [
    "Compound",
    "Oxandrolone"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Oxandrolone is a DHT-derived oral androgen.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Oxandrolone is a DHT-derived oral androgen.",
  "related": [
   "p20",
   "p22",
   "p23"
  ]
 },
 {
  "id": "p22",
  "name": "Turinabol 10",
  "cat": "orals",
  "price": 70,
  "img": "assets/img/products/sf-p22.jpg",
  "specs": [
   [
    "Compound",
    "Chlorodehydromethyltestosterone"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Chlorodehydromethyltestosterone (Turinabol) is an oral derivative of testosterone.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Chlorodehydromethyltestosterone (Turinabol) is an oral derivative of testosterone.",
  "related": [
   "p21",
   "p23",
   "p24"
  ]
 },
 {
  "id": "p23",
  "name": "Superdrol 10",
  "cat": "orals",
  "price": 70,
  "img": "assets/img/products/sf-p23.jpg",
  "specs": [
   [
    "Compound",
    "Methasterone"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Methasterone is a DHT-derived oral androgen.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Methasterone is a DHT-derived oral androgen.",
  "related": [
   "p22",
   "p24",
   "p25"
  ]
 },
 {
  "id": "p24",
  "name": "Dianabol 25",
  "cat": "orals",
  "price": 55,
  "img": "assets/img/products/sf-p24.jpg",
  "specs": [
   [
    "Compound",
    "Methandrostenolone"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Methandrostenolone (Dianabol) is an oral derivative of testosterone.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Methandrostenolone (Dianabol) is an oral derivative of testosterone.",
  "related": [
   "p23",
   "p25",
   "p26"
  ]
 },
 {
  "id": "p25",
  "name": "Anadrol 25",
  "cat": "orals",
  "price": 86,
  "img": "assets/img/products/sf-p25.jpg",
  "specs": [
   [
    "Compound",
    "Oxymetholone"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Oxymetholone (Anadrol) is a DHT-derived oral androgen.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Oxymetholone (Anadrol) is a DHT-derived oral androgen.",
  "related": [
   "p24",
   "p26",
   "p27"
  ]
 },
 {
  "id": "p26",
  "name": "Winstrol 25",
  "cat": "orals",
  "price": 81,
  "img": "assets/img/products/sf-p26.jpg",
  "specs": [
   [
    "Compound",
    "Stanozolol"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Stanozolol is a DHT-derived oral androgen.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Stanozolol is a DHT-derived oral androgen.",
  "related": [
   "p25",
   "p27",
   "p28"
  ]
 },
 {
  "id": "p27",
  "name": "Anavar 50",
  "cat": "orals",
  "price": 181,
  "img": "assets/img/products/sf-p27.jpg",
  "specs": [
   [
    "Compound",
    "Oxandrolone"
   ],
   [
    "Strength",
    "50 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "50 mg per tablet",
  "desc": [
   "Oxandrolone is a DHT-derived oral androgen.",
   "Strength is 50 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Oxandrolone is a DHT-derived oral androgen.",
  "related": [
   "p26",
   "p28",
   "p29"
  ]
 },
 {
  "id": "p28",
  "name": "Halotestin 10",
  "cat": "orals",
  "price": 70,
  "img": "assets/img/products/sf-p28.jpg",
  "specs": [
   [
    "Compound",
    "Fluoxymesterone"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Fluoxymesterone (Halotestin) is a potent oral androgen.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Fluoxymesterone (Halotestin) is a potent oral androgen.",
  "related": [
   "p26",
   "p27",
   "p29"
  ]
 },
 {
  "id": "p29",
  "name": "Proviron 25",
  "cat": "orals",
  "price": 70,
  "img": "assets/img/products/sf-p29.jpg",
  "specs": [
   [
    "Compound",
    "Mesterolone"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Mesterolone (Proviron) is a DHT-derived oral androgen.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Mesterolone (Proviron) is a DHT-derived oral androgen.",
  "related": [
   "p26",
   "p27",
   "p28"
  ]
 },
 {
  "id": "p30",
  "name": "Clomid 50",
  "cat": "pct",
  "price": 50,
  "img": "assets/img/products/sf-p30.jpg",
  "specs": [
   [
    "Compound",
    "Clomiphene Citrate"
   ],
   [
    "Strength",
    "50 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "50 mg per tablet",
  "desc": [
   "Clomiphene citrate is a selective estrogen receptor modulator (SERM).",
   "Strength is 50 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Clomiphene citrate is a selective estrogen receptor modulator (SERM).",
  "related": [
   "p31"
  ]
 },
 {
  "id": "p31",
  "name": "Nolvadex 25",
  "cat": "pct",
  "price": 50,
  "img": "assets/img/products/sf-p31.jpg",
  "specs": [
   [
    "Compound",
    "Tamoxifen Citrate"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Tamoxifen citrate is a selective estrogen receptor modulator (SERM).",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Tamoxifen citrate is a selective estrogen receptor modulator (SERM).",
  "related": [
   "p30"
  ]
 },
 {
  "id": "p32",
  "name": "Gonasi 5000 IU",
  "cat": "hcg",
  "price": 81,
  "img": "assets/img/products/sf-p32.jpg",
  "specs": [
   [
    "Compound",
    "Human Chorionic Gonadotropin (hCG)"
   ],
   [
    "Strength",
    "5000 IU per vial"
   ],
   [
    "Format",
    "Single vial with bacteriostatic water"
   ],
   [
    "Appearance",
    "White lyophilized powder"
   ]
  ],
  "form": "Single vial with bacteriostatic water",
  "strength": "5000 IU per vial",
  "desc": [
   "Human chorionic gonadotropin (hCG) is a gonadotropin hormone, supplied as a lyophilized powder with bacteriostatic water.",
   "Supplied as a single lyophilized vial with bacteriostatic water.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep the unmixed vial in a cool, dry place away from direct light.",
   "After mixing with the included bacteriostatic water, store in the refrigerator, between 2°C and 8°C.",
   "Do not freeze after mixing."
  ],
  "short": "Human chorionic gonadotropin (hCG) is a gonadotropin hormone, supplied as a lyophilized powder with bacteriostatic water.",
  "related": []
 },
 {
  "id": "p33",
  "name": "Letrozole 2.5",
  "cat": "support",
  "price": 60,
  "img": "assets/img/products/sf-p33.jpg",
  "specs": [
   [
    "Compound",
    "Letrozole"
   ],
   [
    "Strength",
    "2.5 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "2.5 mg per tablet",
  "desc": [
   "Letrozole is a non-steroidal aromatase inhibitor.",
   "Strength is 2.5 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Letrozole is a non-steroidal aromatase inhibitor.",
  "related": [
   "p34",
   "p35",
   "p37"
  ]
 },
 {
  "id": "p34",
  "name": "Arimidex 1",
  "cat": "support",
  "price": 50,
  "img": "assets/img/products/sf-p34.jpg",
  "specs": [
   [
    "Compound",
    "Anastrozole"
   ],
   [
    "Strength",
    "1 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "1 mg per tablet",
  "desc": [
   "Anastrozole is a non-steroidal aromatase inhibitor.",
   "Strength is 1 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Anastrozole is a non-steroidal aromatase inhibitor.",
  "related": [
   "p33",
   "p35",
   "p37"
  ]
 },
 {
  "id": "p35",
  "name": "Aromasin 25",
  "cat": "support",
  "price": 50,
  "img": "assets/img/products/sf-p35.jpg",
  "specs": [
   [
    "Compound",
    "Exemestane"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Exemestane is a steroidal aromatase inhibitor.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Exemestane is a steroidal aromatase inhibitor.",
  "related": [
   "p34",
   "p37",
   "p38"
  ]
 },
 {
  "id": "p37",
  "name": "Viagra 25",
  "cat": "support",
  "price": 60,
  "img": "assets/img/products/sf-p37.jpg",
  "specs": [
   [
    "Compound",
    "Sildenafil Citrate"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Sildenafil citrate is a PDE5 inhibitor.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Sildenafil citrate is a PDE5 inhibitor.",
  "related": [
   "p35",
   "p38",
   "p39"
  ]
 },
 {
  "id": "p38",
  "name": "Cialis 25",
  "cat": "support",
  "price": 60,
  "img": "assets/img/products/sf-p38.jpg",
  "specs": [
   [
    "Compound",
    "Tadalafil"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "50 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "50 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Tadalafil is a long-acting PDE5 inhibitor.",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Tadalafil is a long-acting PDE5 inhibitor.",
  "related": [
   "p37",
   "p39",
   "p40"
  ]
 },
 {
  "id": "p39",
  "name": "Superman 50",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p39.jpg",
  "specs": [
   [
    "Compound",
    "Sildenafil Citrate / Tadalafil Blend"
   ],
   [
    "Strength",
    "50 mg total active per tablet"
   ],
   [
    "Format",
    "50 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "50 tablets, foil pouch",
  "strength": "50 mg total active per tablet",
  "desc": [
   "Superman 50 is a combination tablet of sildenafil citrate and tadalafil.",
   "Strength is 50 mg total active per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Superman 50 is a combination tablet of sildenafil citrate and tadalafil.",
  "related": [
   "p38",
   "p40",
   "p41"
  ]
 },
 {
  "id": "p40",
  "name": "Lipo X 125",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p40.jpg",
  "specs": [
   [
    "Compound",
    "Multi-Stage Thermogenic / Lipolytic Complex"
   ],
   [
    "Strength",
    "125 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "125 mg per tablet",
  "desc": [
   "Lipo X is a multi-stage thermogenic and lipolytic complex in tablet form.",
   "Strength is 125 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Lipo X is a multi-stage thermogenic and lipolytic complex in tablet form.",
  "related": [
   "p39",
   "p41",
   "p42"
  ]
 },
 {
  "id": "p41",
  "name": "Cytomel T3 25",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p41.jpg",
  "specs": [
   [
    "Compound",
    "Liothyronine Sodium (T3)"
   ],
   [
    "Strength",
    "25 mcg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "25 mcg per tablet",
  "desc": [
   "Liothyronine sodium (T3) is the active form of thyroid hormone.",
   "Strength is 25 mcg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Liothyronine sodium (T3) is the active form of thyroid hormone.",
  "related": [
   "p40",
   "p42",
   "p43"
  ]
 },
 {
  "id": "p42",
  "name": "Clenbuterol 50",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p42.jpg",
  "specs": [
   [
    "Compound",
    "Clenbuterol Hydrochloride"
   ],
   [
    "Strength",
    "50 mcg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "50 mcg per tablet",
  "desc": [
   "Clenbuterol hydrochloride is a beta-2 adrenergic agonist.",
   "Strength is 50 mcg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Clenbuterol hydrochloride is a beta-2 adrenergic agonist.",
  "related": [
   "p41",
   "p43",
   "p44"
  ]
 },
 {
  "id": "p43",
  "name": "Clenbuterol 200",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p43.jpg",
  "specs": [
   [
    "Compound",
    "Clenbuterol Hydrochloride"
   ],
   [
    "Strength",
    "200 mcg/mL"
   ],
   [
    "Format",
    "30 mL dropper bottle"
   ],
   [
    "Appearance",
    "Clear liquid"
   ]
  ],
  "form": "30 mL dropper bottle",
  "strength": "200 mcg/mL",
  "desc": [
   "Clenbuterol hydrochloride is a beta-2 adrenergic agonist, supplied here as an oral solution.",
   "Supplied as a 30 mL dropper bottle.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep the bottle tightly closed in a cool place away from direct light.",
   "Store upright and out of reach of children."
  ],
  "short": "Clenbuterol hydrochloride is a beta-2 adrenergic agonist, supplied here as an oral solution.",
  "related": [
   "p42",
   "p44",
   "p45"
  ]
 },
 {
  "id": "p44",
  "name": "5-Amino-1MQ 50",
  "cat": "support",
  "price": 220,
  "img": "assets/img/products/sf-p44.jpg",
  "specs": [
   [
    "Compound",
    "5-Amino-1-methylquinolinium"
   ],
   [
    "Strength",
    "50 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "50 mg per tablet",
  "desc": [
   "5-Amino-1MQ is a small-molecule NNMT inhibitor studied in metabolic research.",
   "Strength is 50 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "5-Amino-1MQ is a small-molecule NNMT inhibitor studied in metabolic research.",
  "related": [
   "p43",
   "p45",
   "p46"
  ]
 },
 {
  "id": "p45",
  "name": "Ibutamoren (MK-677) 10",
  "cat": "support",
  "price": 70,
  "img": "assets/img/products/sf-p45.jpg",
  "specs": [
   [
    "Compound",
    "Ibutamoren Mesylate (MK-677)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Ibutamoren (MK-677) is an oral ghrelin receptor agonist and growth hormone secretagogue.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Ibutamoren (MK-677) is an oral ghrelin receptor agonist and growth hormone secretagogue.",
  "related": [
   "p44",
   "p46",
   "p47"
  ]
 },
 {
  "id": "p46",
  "name": "Metabol (SR-9011) 10",
  "cat": "support",
  "price": 91,
  "img": "assets/img/products/sf-p46.jpg",
  "specs": [
   [
    "Compound",
    "SR-9011"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "SR-9011 is a synthetic Rev-ErbA agonist studied in circadian and metabolic research.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "SR-9011 is a synthetic Rev-ErbA agonist studied in circadian and metabolic research.",
  "related": [
   "p45",
   "p47",
   "p48"
  ]
 },
 {
  "id": "p47",
  "name": "Stenabolic (SR-9009) 10",
  "cat": "support",
  "price": 81,
  "img": "assets/img/products/sf-p47.jpg",
  "specs": [
   [
    "Compound",
    "SR-9009"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "SR-9009 is a synthetic Rev-ErbA agonist studied in circadian and metabolic research.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "SR-9009 is a synthetic Rev-ErbA agonist studied in circadian and metabolic research.",
  "related": [
   "p46",
   "p48",
   "p49"
  ]
 },
 {
  "id": "p48",
  "name": "Lipoline (GW-0742) 10",
  "cat": "support",
  "price": 81,
  "img": "assets/img/products/sf-p48.jpg",
  "specs": [
   [
    "Compound",
    "GW-0742"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "GW-0742 is a PPAR-delta receptor agonist studied in metabolic research.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "GW-0742 is a PPAR-delta receptor agonist studied in metabolic research.",
  "related": [
   "p46",
   "p47",
   "p49"
  ]
 },
 {
  "id": "p49",
  "name": "Cardarine (GW-501516) 10",
  "cat": "support",
  "price": 81,
  "img": "assets/img/products/sf-p49.jpg",
  "specs": [
   [
    "Compound",
    "GW-501516 (Cardarine)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "GW-501516 (Cardarine) is a PPAR-delta receptor agonist studied in metabolic research.",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "GW-501516 (Cardarine) is a PPAR-delta receptor agonist studied in metabolic research.",
  "related": [
   "p46",
   "p47",
   "p48"
  ]
 },
 {
  "id": "p56",
  "name": "S23 (Ultrabolic) 25",
  "cat": "sarms",
  "price": 86,
  "img": "assets/img/products/sf-p56.jpg",
  "specs": [
   [
    "Compound",
    "S-23"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "S-23 is a selective androgen receptor modulator (SARM).",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "S-23 is a selective androgen receptor modulator (SARM).",
  "related": [
   "p57",
   "p58",
   "p59"
  ]
 },
 {
  "id": "p57",
  "name": "Andarine (S4) 25",
  "cat": "sarms",
  "price": 86,
  "img": "assets/img/products/sf-p57.jpg",
  "specs": [
   [
    "Compound",
    "S-4 (Andarine)"
   ],
   [
    "Strength",
    "25 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "25 mg per tablet",
  "desc": [
   "Andarine (S-4) is a selective androgen receptor modulator (SARM).",
   "Strength is 25 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Andarine (S-4) is a selective androgen receptor modulator (SARM).",
  "related": [
   "p56",
   "p58",
   "p59"
  ]
 },
 {
  "id": "p58",
  "name": "Ligandrol (LGD-4033) 10",
  "cat": "sarms",
  "price": 81,
  "img": "assets/img/products/sf-p58.jpg",
  "specs": [
   [
    "Compound",
    "LGD-4033 (Ligandrol)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Ligandrol (LGD-4033) is a selective androgen receptor modulator (SARM).",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Ligandrol (LGD-4033) is a selective androgen receptor modulator (SARM).",
  "related": [
   "p57",
   "p59",
   "p60"
  ]
 },
 {
  "id": "p59",
  "name": "Megabolic (LGD-3033) 10",
  "cat": "sarms",
  "price": 86,
  "img": "assets/img/products/sf-p59.jpg",
  "specs": [
   [
    "Compound",
    "LGD-3033"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "LGD-3033 is a selective androgen receptor modulator (SARM).",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "LGD-3033 is a selective androgen receptor modulator (SARM).",
  "related": [
   "p58",
   "p60",
   "p61"
  ]
 },
 {
  "id": "p60",
  "name": "Sustalone (RAD-150) 10",
  "cat": "sarms",
  "price": 91,
  "img": "assets/img/products/sf-p60.jpg",
  "specs": [
   [
    "Compound",
    "RAD-150 (TLB-150 Benzoate)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "RAD-150 (TLB-150 benzoate) is a selective androgen receptor modulator (SARM).",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "RAD-150 (TLB-150 benzoate) is a selective androgen receptor modulator (SARM).",
  "related": [
   "p59",
   "p61",
   "p62"
  ]
 },
 {
  "id": "p61",
  "name": "Myobol (YK-11) 5",
  "cat": "sarms",
  "price": 86,
  "img": "assets/img/products/sf-p61.jpg",
  "specs": [
   [
    "Compound",
    "YK-11"
   ],
   [
    "Strength",
    "5 mg per tablet"
   ],
   [
    "Format",
    "60 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "60 tablets, foil pouch",
  "strength": "5 mg per tablet",
  "desc": [
   "YK-11 is a steroidal selective androgen receptor modulator studied for its effect on myostatin signaling.",
   "Strength is 5 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "YK-11 is a steroidal selective androgen receptor modulator studied for its effect on myostatin signaling.",
  "related": [
   "p60",
   "p62",
   "p63"
  ]
 },
 {
  "id": "p62",
  "name": "Ostarine (MK-2866) 10",
  "cat": "sarms",
  "price": 81,
  "img": "assets/img/products/sf-p62.jpg",
  "specs": [
   [
    "Compound",
    "MK-2866 (Ostarine / Enobosarm)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Ostarine (MK-2866, enobosarm) is a selective androgen receptor modulator (SARM).",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Ostarine (MK-2866, enobosarm) is a selective androgen receptor modulator (SARM).",
  "related": [
   "p60",
   "p61",
   "p63"
  ]
 },
 {
  "id": "p63",
  "name": "Testolone (RAD-140) 10",
  "cat": "sarms",
  "price": 91,
  "img": "assets/img/products/sf-p63.jpg",
  "specs": [
   [
    "Compound",
    "RAD-140 (Testolone)"
   ],
   [
    "Strength",
    "10 mg per tablet"
   ],
   [
    "Format",
    "100 tablets, foil pouch"
   ],
   [
    "Appearance",
    "Tablet"
   ]
  ],
  "form": "100 tablets, foil pouch",
  "strength": "10 mg per tablet",
  "desc": [
   "Testolone (RAD-140) is a selective androgen receptor modulator (SARM).",
   "Strength is 10 mg per tablet. Supplied as tablets in a sealed foil pouch.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Keep tablets in the original foil pouch until needed.",
   "Store in a cool, dry place away from light and moisture.",
   "Keep out of reach of children."
  ],
  "short": "Testolone (RAD-140) is a selective androgen receptor modulator (SARM).",
  "related": [
   "p60",
   "p61",
   "p62"
  ]
 },
 {
  "id": "p64",
  "name": "Testosterone Suspension 100",
  "cat": "injectables",
  "price": 55,
  "img": "assets/img/products/sf-p64.jpg",
  "specs": [
   [
    "Compound",
    "Testosterone (Unesterified Base)"
   ],
   [
    "Strength",
    "100 mg per mL"
   ],
   [
    "Format",
    "10 mL multi-dose vial"
   ],
   [
    "Appearance",
    "Milky suspension"
   ]
  ],
  "form": "10 mL multi-dose vial",
  "strength": "100 mg per mL",
  "desc": [
   "Testosterone suspension is unesterified testosterone in an aqueous suspension.",
   "Strength is 100 mg per mL. Supplied as a sealed 10 mL multi-dose vial.",
   "Please check the label for compound, strength and format before handling. Sold for research use only."
  ],
  "recs": [
   "Shake the vial well before use; the contents settle.",
   "Store at room temperature, away from direct light. Do not freeze.",
   "Keep the vial sealed and upright."
  ],
  "short": "Testosterone suspension is unesterified testosterone in an aqueous suspension.",
  "related": [
   "p17",
   "p18",
   "p19"
  ]
 }
];
const MIN_ORDER = 80;
