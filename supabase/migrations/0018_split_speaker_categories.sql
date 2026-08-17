-- Splits the catch-all "Акустика (підлогова/полична)" bucket into
-- floorstanding / bookshelf / planar, using product-line knowledge to place
-- ~112 known floorstander models and the 5 Magnepan planar models; everything
-- left over defaults to bookshelf/stand-mount.
--
-- Applied remotely as: split_speaker_categories.

update public.components set category = 'Акустика підлогова'
where category = 'Акустика (підлогова/полична)' and (brand, model) in (
  ('Acoustic Energy','AE500'), ('Acoustic Energy','AE509'),
  ('Amphion','Argon7LS'),
  ('Bowers & Wilkins','603 S3'), ('Bowers & Wilkins','702 S3'), ('Bowers & Wilkins','703 S3'),
  ('Bowers & Wilkins','704 S3'), ('Bowers & Wilkins','801 D4'), ('Bowers & Wilkins','802 D4'),
  ('Bowers & Wilkins','803 D4'), ('Bowers & Wilkins','804 D4'),
  ('Buchardt Audio','A500'), ('Buchardt Audio','A700'),
  ('Cambridge Audio','SX-80'),
  ('Castle','Windsor Duke'),
  ('Dali','Rubicon 5'), ('Dali','Rubicon 6'), ('Dali','Rubicon 8'),
  ('Dali','Opticon 6 MK2'), ('Dali','Opticon 8 MK2'),
  ('Dali','Oberon 5'), ('Dali','Oberon 7'), ('Dali','Oberon 9'),
  ('Dali','Epicon 6'), ('Dali','Epicon 8'), ('Dali','Spektor 6'), ('Dali','Zensor 3'),
  ('ELAC','Carina FS247.4'), ('ELAC','Debut 2.0 F5.2'), ('ELAC','Debut 2.0 F6.2'),
  ('ELAC','Uni-Fi 2.0 UF52'), ('ELAC','Uni-Fi Reference UFR52'), ('ELAC','Vela FS 407'),
  ('Focal','Aria 936'), ('Focal','Aria 948'), ('Focal','Chora 816'), ('Focal','Chora 826'),
  ('Focal','Kanta No2'), ('Focal','Kanta No3'), ('Focal','Sopra No2'), ('Focal','Sopra No3'),
  ('Focal','Theva No2'), ('Focal','Theva No3'), ('Focal','Vestia No2'), ('Focal','Vestia No3'),
  ('Fyne Audio','F1-8'), ('Fyne Audio','F1-12'), ('Fyne Audio','F302'), ('Fyne Audio','F303'),
  ('Fyne Audio','F501'), ('Fyne Audio','F502'), ('Fyne Audio','Vintage Ten'),
  ('Jamo','C 97 II'), ('Jamo','S 807'), ('Jamo','S 809'),
  ('JBL','HDI-3600'), ('JBL','L100 Classic MkII'), ('JBL','Stage A170'), ('JBL','Stage A190'), ('JBL','Studio 630'),
  ('KEF','Blade Two Meta'), ('KEF','Q550'), ('KEF','Q650c'), ('KEF','Q750'), ('KEF','Q950'),
  ('KEF','R5 Meta'), ('KEF','R7 Meta'), ('KEF','R11 Meta'), ('KEF','Reference 3 Meta'), ('KEF','Reference 5 Meta'),
  ('Klipsch','Cornwall IV'), ('Klipsch','Forte IV'), ('Klipsch','Heresy IV'), ('Klipsch','Klipschorn AK6'),
  ('Klipsch','La Scala AL5'), ('Klipsch','RP-6000F II'), ('Klipsch','RP-8000F II'),
  ('Mission','LX-5 MkII'),
  ('Monitor Audio','Bronze 500'), ('Monitor Audio','Gold 300 5G'), ('Monitor Audio','Platinum 300 3G'),
  ('Monitor Audio','Silver 300 7G'), ('Monitor Audio','Silver 500 7G'),
  ('PMC','fact.8 signature'), ('PMC','twenty5.23i'), ('PMC','twenty5.24i'),
  ('Polk Audio','Reserve R500'), ('Polk Audio','Reserve R700'),
  ('ProAc','Response D20R'),
  ('Q Acoustics','3050i'), ('Q Acoustics','5040'), ('Q Acoustics','5050'), ('Q Acoustics','Concept 300'),
  ('Revel','Performa F226Be'), ('Revel','Ultima Salon2'),
  ('Sonus Faber','Lumina V'), ('Sonus Faber','Olympica Nova III'), ('Sonus Faber','Maxima Amator'),
  ('Spendor','A4'), ('Spendor','A7'), ('Spendor','D7.2'), ('Spendor','D9.2'),
  ('Tannoy','Stirling III LZ'),
  ('Triangle','Borea BR08'), ('Triangle','Comete 40th'),
  ('Wharfedale','Diamond 12.3'), ('Wharfedale','Diamond 12.4'), ('Wharfedale','Evo 4.3'),
  ('Yamaha','NS-800A'), ('Yamaha','NS-F150'), ('Yamaha','NS-F51'),
  ('Denon','SC-F109')
);

update public.components set category = 'Акустика планарна'
where category = 'Акустика (підлогова/полична)' and brand = 'Magnepan';

update public.components set category = 'Акустика полична'
where category = 'Акустика (підлогова/полична)';
