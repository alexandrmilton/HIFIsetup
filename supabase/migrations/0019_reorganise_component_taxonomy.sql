-- Follow-up taxonomy passes from the same request as 0018:
--  * "Накладні навушники" + "Внутрішньоканальні" -> single "Навушники".
--  * "Кабелі та комутація" split into interconnect / speaker / power /
--    digital / phono cable, by known product-line lookup.
--  * "Фонокоректор" split into tube / solid-state.
--  * "Підсилювач потужності" renamed to "Моноблоки" (clearer than a
--    near-duplicate of "Інтегральний підсилювач").
--  * "Процесор / DSP" merged into "Еквалайзер" as "Еквалайзер / DSP".
--  * "Медіа-сервер" merged into "Мережевий програвач".
--
-- Applied remotely as: merge_headphone_categories, split_cable_and_phono_categories,
-- simplify_amp_dsp_streamer_categories.

update public.components set category = 'Навушники'
where category in ('Накладні навушники', 'Внутрішньоканальні');

update public.components set category = 'Акустичний кабель'
where category = 'Кабелі та комутація' and (brand, model) in (
  ('Atlas Cables','Ailsa'), ('Atlas Cables','Equator'),
  ('AudioQuest','Rocket 11'), ('AudioQuest','Rocket 33'), ('AudioQuest','Rocket 44'), ('AudioQuest','Type 4'),
  ('Blue Jeans Cable','Belden 5000UE'),
  ('Canare','4S11'),
  ('Chord Company','Epic X'), ('Chord Company','Signature XL'),
  ('Kimber Kable','12TC'), ('Kimber Kable','8TC'),
  ('QED','Performance Audio 40'), ('QED','Profile 42'), ('QED','Reference XT40'),
  ('QED','Reference XT40i'), ('QED','Silver Anniversary XT'), ('QED','Supremus'), ('QED','XT25'),
  ('Supra','Classic 2.5'), ('Supra','EFF-I'), ('Supra','Ply 3.4/S'), ('Supra','Rondo 4x2.5'),
  ('Tellurium Q','Blue II'), ('Tellurium Q','Ultra Blue II'),
  ('TTAF','93027 OFC CL2'),
  ('Wireworld','Oasis 8'), ('WireWorld','Eclipse 8')
);

update public.components set category = 'Кабель живлення'
where category = 'Кабелі та комутація' and (brand, model) in (
  ('AudioQuest','NRG-X3'),
  ('Nordost','White Lightning'),
  ('Chord Company','GroundARAY'),
  ('YYAUDIO','Hi-End з чистої міді 3x4mm 5500w')
);

update public.components set category = 'Цифровий кабель'
where category = 'Кабелі та комутація' and (brand, model) in (
  ('AudioQuest','Carbon USB'), ('AudioQuest','Cinnamon USB'), ('AudioQuest','Forest Optical'), ('AudioQuest','Pearl HDMI'),
  ('Blue Jeans Cable','Belden 1694A'),
  ('Supra','USB 2.0'),
  ('Wireworld','Chroma USB'), ('Wireworld','Starlight 8')
);

update public.components set category = 'Фонокабель'
where category = 'Кабелі та комутація' and (brand, model) in (
  ('Pro-Ject','Connect it Phono E RCA'),
  ('Chord Company','C-Screen'),
  ('Kimber Kable','4PR'),
  ('Van den Hul','The Wind'), ('Van den Hul','The Teatrack')
);

update public.components set category = 'Міжблочний кабель'
where category = 'Кабелі та комутація';

update public.components set category = 'Фонокоректор ламповий'
where category = 'Фонокоректор' and (brand, model) in (
  ('HiFi','Ламповий фонік'),
  ('Pro-Ject','Tube Box S2'),
  ('Musical Fidelity','Nu-Vista Vinyl 2'),
  ('Vincent','PHO-200'), ('Vincent','PHO-701'), ('Vincent','PHO-8')
);

update public.components set category = 'Фонокоректор транзисторний'
where category = 'Фонокоректор';

update public.components set category = 'Моноблоки'
where category = 'Підсилювач потужності';

update public.components set category = 'Еквалайзер / DSP'
where category in ('Процесор / DSP', 'Еквалайзер');

update public.components set category = 'Мережевий програвач'
where category = 'Медіа-сервер';
