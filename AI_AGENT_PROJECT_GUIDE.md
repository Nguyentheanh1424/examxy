# Examxy AI Coding Agent Project Guide

**PhiÃªn báº£n:** 1.0  
**Tráº¡ng thÃ¡i:** Active  
**Pháº¡m vi:** TÃ i liá»‡u váº­n hÃ nh cho AI agent há»— trá»£ code trong toÃ n bá»™ project Examxy  
**Nguá»“n thiáº¿t káº¿ gá»‘c:** Examxy Design System (EDS) v3.0  

---

## 1. Má»¥c tiÃªu

TÃ i liá»‡u nÃ y Ä‘á»‹nh nghÄ©a cÃ¡ch má»™t AI coding agent pháº£i Ä‘á»c, sinh, sá»­a, review vÃ  Ä‘á»“ng bá»™ mÃ£ nguá»“n trong project Examxy Ä‘á»ƒ:

- giá»¯ nguyÃªn toÃ n bá»™ thiáº¿t káº¿ Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c láº­p trong EDS v3.0;
- trÃ¡nh sinh code rá»i ráº¡c, trÃ¹ng láº·p, khÃ³ báº£o trÃ¬;
- biáº¿n Design System thÃ nh **nguá»“n sá»± tháº­t duy nháº¥t** cho UI;
- Ä‘áº£m báº£o má»i thay Ä‘á»•i Ä‘á»u Ä‘Æ°á»£c cáº­p nháº­t Ä‘á»“ng bá»™ giá»¯a token, component, feature, tÃ i liá»‡u vÃ  test.

> **NguyÃªn táº¯c tá»‘i cao:** tÃ i liá»‡u nÃ y **bá»• sung** cho EDS v3.0, khÃ´ng thay tháº¿. Khi cÃ³ xung Ä‘á»™t, **EDS v3.0 luÃ´n tháº¯ng**.

---

## 2. Quan há»‡ giá»¯a AI Agent vÃ  EDS v3.0

AI agent chá»‰ Ä‘Æ°á»£c phÃ©p má»Ÿ rá»™ng project theo hÆ°á»›ng **tuÃ¢n thá»§ contract Ä‘Ã£ cÃ³**, tuyá»‡t Ä‘á»‘i khÃ´ng Ä‘Æ°á»£c tá»± Ã½ tÃ¡i Ä‘á»‹nh nghÄ©a ngÃ´n ngá»¯ thiáº¿t káº¿.

### 2.1. Nhá»¯ng gÃ¬ pháº£i giá»¯ nguyÃªn

AI agent pháº£i giá»¯ nguyÃªn cÃ¡c Ä‘á»‹nh nghÄ©a cá»‘t lÃµi sau:

1. **Functional Minimalism** lÃ m Ä‘á»‹nh hÆ°á»›ng tháº©m má»¹ chÃ­nh.
2. **Tailwind CSS** lÃ  lá»›p triá»ƒn khai giao diá»‡n chÃ­nh.
3. **OKLCH + CSS Variables + Tailwind theme extension** lÃ  chuáº©n quáº£n trá»‹ mÃ u.
4. **Geist Sans / Geist Mono** lÃ  há»‡ font máº·c Ä‘á»‹nh.
5. **Fluid typography** vá»›i body text mobile khÃ´ng nhá» hÆ¡n `16px`.
6. **Responsive Bento Grid** lÃ  tÆ° duy layout chÃ­nh.
7. **Mobile touch target tá»‘i thiá»ƒu 44px** cho má»i interactive element.
8. **Lucide Icons** lÃ  nguá»“n icon chuáº©n.
9. **Motion pháº£i há»— trá»£ reduced motion**.
10. **5 component contract cá»‘t lÃµi** pháº£i Ä‘Æ°á»£c báº£o toÃ n:
   - Button
   - Multiple Choice Option
   - Text Field
   - Data Table
   - OMR Scanner Viewfinder
11. **WCAG 2.2** lÃ  baseline báº¯t buá»™c.
12. **Tone of voice chuyÃªn nghiá»‡p, gáº§n gÅ©i, tÃ­ch cá»±c** pháº£i nháº¥t quÃ¡n á»Ÿ má»i copy UI.

### 2.2. Nhá»¯ng gÃ¬ AI agent khÃ´ng Ä‘Æ°á»£c phÃ©p lÃ m

AI agent khÃ´ng Ä‘Æ°á»£c:

- thay mÃ u báº±ng HEX/HSL rá»i ráº¡c náº¿u token Ä‘Ã£ tá»“n táº¡i trong há»‡ thá»‘ng;
- tá»± thÃªm icon ngoÃ i Lucide khi chÆ°a cÃ³ phÃª duyá»‡t thiáº¿t káº¿;
- táº¡o component má»›i náº¿u cÃ³ thá»ƒ giáº£i quyáº¿t báº±ng variant/slot cá»§a component hiá»‡n há»¯u;
- hard-code typography, spacing, radius, shadow, breakpoint theo cáº£m tÃ­nh;
- táº¡o nhiá»u cÃ¡ch viáº¿t khÃ¡c nhau cho cÃ¹ng má»™t pattern UI;
- thÃªm animation khÃ´ng náº±m trong triáº¿t lÃ½ motion hiá»‡n cÃ³;
- dÃ¹ng mÃ u sáº¯c nhÆ° tÃ­n hiá»‡u duy nháº¥t cho tráº¡ng thÃ¡i lá»—i/thÃ nh cÃ´ng/cáº£nh bÃ¡o;
- táº¡o shortcut â€œcode cho nhanhâ€ nhÆ°ng lÃ m lá»‡ch contract cá»§a component.

---

## 3. Kiáº¿n trÃºc nguá»“n sá»± tháº­t duy nháº¥t (Single Source of Truth)

Äá»ƒ mÃ£ nguá»“n khÃ´ng bá»‹ phÃ¢n máº£nh, toÃ n project pháº£i cÃ³ cáº¥u trÃºc nguá»“n sá»± tháº­t duy nháº¥t nhÆ° sau.

## 3.1. Nguá»“n sá»± tháº­t theo tá»«ng lá»›p

| Lá»›p | Nguá»“n sá»± tháº­t duy nháº¥t | KhÃ´ng Ä‘Æ°á»£c phÃ©p |
|---|---|---|
| Color tokens | `src/styles/tokens.css` hoáº·c `app/globals.css` | Khai bÃ¡o mÃ u rá»i ráº¡c trong component |
| Tailwind theme | `tailwind.config.(js|ts)` | Tá»± Ä‘á»‹nh nghÄ©a láº¡i token á»Ÿ file láº» |
| Typography scale | Tailwind theme + CSS font variables | Set font-size thá»§ cÃ´ng láº·p láº¡i á»Ÿ nhiá»u nÆ¡i |
| Motion/easing/duration | Tailwind theme extension | Viáº¿t easing rá»i ráº¡c trong tá»«ng component |
| Icons | `lucide-react` + shared icon wrapper | SVG láº», icon font, nhiá»u bá»™ icon |
| UI primitives | `src/components/ui/*` | Táº¡o láº¡i button/input/table á»Ÿ tá»«ng feature |
| Feature-specific UI | `src/features/<feature>/components/*` | Äáº·t business UI láº«n vá»›i ui primitives |
| Domain types | `src/types/*` hoáº·c `src/features/<feature>/types.ts` | Khai bÃ¡o type trÃ¹ng nhau á»Ÿ nhiá»u file |
| Copy chuáº©n | `src/constants/copy/*` hoáº·c feature-local copy module | Hard-code message cÃ¹ng nghÄ©a á»Ÿ nhiá»u nÆ¡i |
| Docs chuáº©n | `docs/*` | Giáº£i thÃ­ch hÃ nh vi chá»‰ náº±m trong code comment |
| Test contract | `tests/*`, `*.test.*`, `*.spec.*` | Chá»‰ test happy path báº±ng tay |

## 3.2. Cáº¥u trÃºc thÆ° má»¥c khuyáº¿n nghá»‹

```txt
src/
  app/ or pages/
  styles/
    tokens.css
    globals.css
  components/
    ui/
      button/
      text-field/
      multiple-choice-option/
      data-table/
      omr-viewfinder/
      icon/
    layouts/
  features/
    exams/
    omr/
    dashboard/
    grading/
  lib/
    utils/
    accessibility/
    motion/
    formatting/
  hooks/
  constants/
    copy/
    routes/
  types/
  services/
  stores/

docs/
  design-system/
  architecture/
  conventions/
  adr/
  ai-agent/

tests/
  accessibility/
  integration/
  visual/
```

### 3.3. Quy táº¯c phÃ¢n lá»›p báº¯t buá»™c

- `components/ui` chá»‰ chá»©a **primitive hoáº·c shared patterns**.
- `features/*` chá»©a UI gáº¯n vá»›i nghiá»‡p vá»¥.
- `lib/*` chá»©a logic tÃ¡i sá»­ dá»¥ng thuáº§n tÃºy, khÃ´ng phá»¥ thuá»™c feature cá»¥ thá»ƒ.
- `services/*` chá»©a giao tiáº¿p API/external IO.
- `types/*` chá»©a domain contract dÃ¹ng chung.
- `docs/*` pháº£i pháº£n Ã¡nh kiáº¿n trÃºc tháº­t, khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ lá»‡ch vá»›i code hiá»‡n táº¡i.

---

## 4. Quy táº¯c váº­n hÃ nh cho AI coding agent

## 4.1. Workflow báº¯t buá»™c trÆ°á»›c khi viáº¿t code

TrÆ°á»›c má»i thay Ä‘á»•i, AI agent pháº£i thá»±c hiá»‡n tuáº§n tá»±:

1. **Äá»c contract hiá»‡n cÃ³**: xÃ¡c Ä‘á»‹nh component, token, variant, state, naming pattern vÃ  thÆ° má»¥c liÃªn quan.
2. **Audit kháº£ nÄƒng tÃ¡i sá»­ dá»¥ng**: Æ°u tiÃªn sá»­a/extend component hiá»‡n cÃ³ thay vÃ¬ táº¡o má»›i.
3. **XÃ¡c Ä‘á»‹nh pháº¡m vi áº£nh hÆ°á»Ÿng**: UI, type, test, docs, accessibility, motion, copy.
4. **Chá»n thay Ä‘á»•i nhá» nháº¥t cÃ³ Ã½ nghÄ©a**: khÃ´ng refactor lan rá»™ng náº¿u khÃ´ng cáº§n.
5. **Cáº­p nháº­t Ä‘á»“ng bá»™ táº¥t cáº£ lá»›p bá»‹ áº£nh hÆ°á»Ÿng** trÆ°á»›c khi káº¿t thÃºc.

## 4.2. Workflow báº¯t buá»™c sau khi viáº¿t code

Sau khi sá»­a code, AI agent pháº£i tá»± kiá»ƒm tra:

1. component cÃ²n Ä‘Ãºng contract EDS khÃ´ng;
2. class Tailwind cÃ³ dÃ¹ng Ä‘Ãºng token/theme khÃ´ng;
3. state hover/focus/disabled/error/loading Ä‘Ã£ Ä‘áº§y Ä‘á»§ chÆ°a;
4. mobile hitbox 44px cÃ³ bá»‹ vi pháº¡m khÃ´ng;
5. aria/focus ring/keyboard navigation cÃ³ Ä‘áº§y Ä‘á»§ khÃ´ng;
6. type, test, story/docs, snapshot cÃ³ cáº§n cáº­p nháº­t khÃ´ng;
7. cÃ³ táº¡o duplication hoáº·c utility má»›i khÃ´ng cáº§n thiáº¿t khÃ´ng.

## 4.3. NguyÃªn táº¯c ra quyáº¿t Ä‘á»‹nh

Khi cÃ³ nhiá»u cÃ¡ch triá»ƒn khai, AI agent pháº£i Æ°u tiÃªn theo thá»© tá»±:

1. **TÃ¡i sá»­ dá»¥ng pattern hiá»‡n cÃ³**
2. **Má»Ÿ rá»™ng báº±ng variant/slot/prop**
3. **TÃ¡ch shared abstraction nhá», rÃµ rÃ ng**
4. **Táº¡o component má»›i** chá»‰ khi 3 bÆ°á»›c trÃªn khÃ´ng giáº£i quyáº¿t Ä‘Æ°á»£c

---

## 5. Bá»™ rule báº¯t buá»™c Ä‘á»ƒ mÃ£ nguá»“n luÃ´n Ä‘á»“ng bá»™

## 5.1. Rule 01 - Má»™t token, má»™t nÆ¡i Ä‘á»‹nh nghÄ©a

- MÃ u, font, easing, duration, border radius, shadow, spacing Ä‘áº·c thÃ¹ chá»‰ Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a á»Ÿ nÆ¡i gá»‘c.
- Component chá»‰ **consume token**, khÃ´ng tÃ¡i Ä‘á»‹nh nghÄ©a token.
- Náº¿u thiáº¿u token, pháº£i thÃªm vÃ o layer token/theme trÆ°á»›c, rá»“i má»›i dÃ¹ng trong component.

## 5.2. Rule 02 - KhÃ´ng táº¡o component song song khÃ¡c nghÄ©a

KhÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ tá»“n táº¡i nhiá»u implementation cho cÃ¹ng má»™t khÃ¡i niá»‡m UI, vÃ­ dá»¥:

- `PrimaryButton`, `MainButton`, `ActionButton` cÃ¹ng vai trÃ²
- `Input`, `TextInput`, `FormInput` nhÆ°ng style/behavior khÃ¡c nhau
- `Table`, `DataGrid`, `ListTable` nhÆ°ng cÃ¹ng use case

Náº¿u cÃ¹ng vai trÃ², pháº£i há»£p nháº¥t vá» **má»™t component chuáº©n** vá»›i variant rÃµ rÃ ng.

## 5.3. Rule 03 - Má»i tráº¡ng thÃ¡i pháº£i Ä‘Æ°á»£c mÃ´ hÃ¬nh hÃ³a táº­p trung

Má»—i component chuáº©n pháº£i cÃ³ báº£ng state rÃµ rÃ ng:

- default
- hover
- focus-visible
- active
- disabled
- loading
- success/error/warning (náº¿u Ã¡p dá»¥ng)
- selected/checked (náº¿u Ã¡p dá»¥ng)

KhÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ state chá»‰ tá»“n táº¡i á»Ÿ CSS ngáº«u nhiÃªn mÃ  khÃ´ng Ä‘Æ°á»£c Ä‘á»‹nh danh trong docs hoáº·c API props.

## 5.4. Rule 04 - Má»i thay Ä‘á»•i UI pháº£i kÃ©o theo cáº­p nháº­t phá»¥ trá»£

Báº¥t ká»³ thay Ä‘á»•i nÃ o á»Ÿ UI Ä‘á»u pháº£i xem xÃ©t Ä‘á»“ng thá»i:

- docs
- type/interface
- tests
- story/demo
- accessibility label/aria
- loading/empty/error state
- responsive behavior

KhÃ´ng cháº¥p nháº­n thay Ä‘á»•i â€œxong pháº§n giao diá»‡nâ€ nhÆ°ng bá» sÃ³t cÃ¡c lá»›p phá»¥ trá»£.

## 5.5. Rule 05 - Shared logic pháº£i Ä‘Æ°á»£c tÃ¡ch, nhÆ°ng chá»‰ khi tháº­t sá»± shared

- Logic Ä‘Æ°á»£c dÃ¹ng tá»« 2 nÆ¡i trá»Ÿ lÃªn vÃ  cÃ¹ng má»™t Ã½ nghÄ©a -> tÃ¡ch shared helper/hook.
- Logic chá»‰ dÃ¹ng 1 nÆ¡i -> Ä‘á»ƒ local trong feature Ä‘á»ƒ trÃ¡nh trá»«u tÆ°á»£ng hÃ³a sá»›m.
- KhÃ´ng trÃ­ch xuáº¥t utility chung chá»‰ vÃ¬ tháº¥y file dÃ i.

## 5.6. Rule 06 - TÃªn gá»i pháº£i pháº£n Ã¡nh Ä‘Ãºng domain vÃ  cáº¥p Ä‘á»™ tÃ¡i sá»­ dá»¥ng

- Shared primitive: `Button`, `TextField`, `DataTable`
- Business component: `ExamSubmissionButton`, `StudentScoreTable`
- Hook: `useOmrScanner`, `useStudentFilters`
- Helper thuáº§n: `formatScore`, `buildPaginationRange`

TrÃ¡nh dÃ¹ng tÃªn mÆ¡ há»“ nhÆ° `Helper`, `Manager`, `Common`, `Thing`, `Wrapper2`.

## 5.7. Rule 07 - KhÃ´ng hard-code style khi Ä‘Ã£ cÃ³ semantic variant

VÃ­ dá»¥ Ä‘Ãºng:

```tsx
<Button variant="danger" size="md" />
```

VÃ­ dá»¥ sai:

```tsx
<button className="bg-red-500 px-4 py-2 rounded-lg text-white">XÃ³a</button>
```

Náº¿u cáº§n style má»›i láº·p láº¡i nhiá»u láº§n, pháº£i má»Ÿ rá»™ng variant/token, khÃ´ng copy class thá»§ cÃ´ng.

## 5.8. Rule 08 - Má»™t hÃ nh vi, má»™t API thá»‘ng nháº¥t

VÃ­ dá»¥:

- Loading cá»§a button luÃ´n lÃ  `isLoading`
- Disabled luÃ´n lÃ  `disabled` hoáº·c `isDisabled` theo chuáº©n Ä‘Ã£ chá»n
- Error cá»§a input luÃ´n lÃ  `error`
- Hint phá»¥ trá»£ luÃ´n lÃ  `hint` hoáº·c `helperText` theo chuáº©n toÃ n repo

KhÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ cÃ¹ng má»™t meaning nhÆ°ng nhiá»u prop name khÃ¡c nhau.

## 5.9. Rule 09 - Responsive pháº£i nháº¥t quÃ¡n theo design system

- Mobile-first lÃ  máº·c Ä‘á»‹nh.
- Touch target trÃªn mobile tá»‘i thiá»ƒu `44px`.
- Body text mobile tá»‘i thiá»ƒu `16px`.
- Layout pháº£i dÃ¹ng grid/spacing nháº¥t quÃ¡n vá»›i Bento logic.
- KhÃ´ng chÃ¨n breakpoint tÃ¹y há»©ng náº¿u chÆ°a chá»©ng minh cáº§n thiáº¿t.

## 5.10. Rule 10 - Accessibility lÃ  má»™t pháº§n cá»§a contract, khÃ´ng pháº£i pháº§n thÃªm vÃ o sau

Má»—i component interactive báº¯t buá»™c pháº£i cÃ³:

- keyboard access;
- focus-visible rÃµ rÃ ng;
- aria label hoáº·c native semantics phÃ¹ há»£p;
- text/error/helper há»— trá»£ Ä‘á»c hiá»ƒu;
- icon-only button cÃ³ accessible name;
- tráº¡ng thÃ¡i selected/error/success khÃ´ng chá»‰ truyá»n báº±ng mÃ u;
- reduced motion Ä‘Æ°á»£c tÃ´n trá»ng khi animation Ä‘Ã¡ng ká»ƒ.

## 5.11. Rule 11 - Copy pháº£i Ä‘á»“ng nháº¥t vá» giá»ng vÄƒn

Má»i microcopy sinh bá»Ÿi AI agent pháº£i tuÃ¢n thá»§:

- rÃµ rÃ ng;
- ngáº¯n gá»n;
- tÃ­ch cá»±c;
- chuyÃªn nghiá»‡p nhÆ°ng gáº§n gÅ©i;
- khÃ´ng pha trÃ² á»Ÿ context nghiÃªm tÃºc nhÆ° cháº¥m Ä‘iá»ƒm, thi cá»­, lá»—i há»‡ thá»‘ng.

## 5.12. Rule 12 - Khi thÃªm má»›i, pháº£i chá»©ng minh vÃ¬ sao khÃ´ng dÃ¹ng láº¡i cÃ¡i cÅ©

Báº¥t ká»³ component/module má»›i nÃ o cÅ©ng pháº£i tráº£ lá»i Ä‘Æ°á»£c 3 cÃ¢u há»i:

1. Váº¥n Ä‘á» thá»±c táº¿ lÃ  gÃ¬?
2. VÃ¬ sao component hiá»‡n cÃ³ khÃ´ng giáº£i quyáº¿t Ä‘Æ°á»£c?
3. VÃ¬ sao khÃ´ng thá»ƒ má»Ÿ rá»™ng báº±ng variant/slot?

Náº¿u khÃ´ng tráº£ lá»i rÃµ, khÃ´ng Ä‘Æ°á»£c táº¡o má»›i.

---

## 6. Mapping thay Ä‘á»•i -> pháº§n báº¯t buá»™c pháº£i Ä‘á»“ng bá»™

| Khi thay Ä‘á»•i | Pháº£i cáº­p nháº­t Ä‘á»“ng thá»i |
|---|---|
| CSS color token | CSS variables, Tailwind theme, docs token, component reference, contrast check |
| Font/typography scale | Tailwind theme, docs typography, heading usage, responsive review |
| Motion/easing | Tailwind theme, reduced-motion handling, component transitions, docs motion |
| Shared component API | component code, type, tests, story/demo, docs, all call sites |
| Shared variant má»›i | variant mapping, snapshot/demo, docs, visual review, QA cases |
| Input validation behavior | UI state, helper/error text, aria-invalid, tests, forms docs |
| Data table behavior | sort/filter/select API, sticky header, alignments, keyboard behavior, docs |
| OMR scanner state | state machine/UI state, motion, haptic/audio fallback, tests, docs |
| Copy text chung | constants, all screens reuse, docs tone guidelines |
| Folder/module structure | import path, barrel exports, docs architecture |

> **Quy táº¯c chá»‘t:** thay Ä‘á»•i khÃ´ng hoÃ n táº¥t náº¿u cÃ²n má»™t lá»›p liÃªn quan chÆ°a Ä‘Æ°á»£c cáº­p nháº­t.

---

## 7. Chuáº©n triá»ƒn khai theo tá»«ng lá»›p ká»¹ thuáº­t

## 7.1. Styling rules

- Æ¯u tiÃªn Tailwind utility theo token semantic.
- KhÃ´ng dÃ¹ng inline style cho cÃ¡c giÃ¡ trá»‹ cÃ³ thá»ƒ biá»ƒu diá»…n qua token/theme.
- Chá»‰ dÃ¹ng inline style khi tháº­t sá»± cáº§n giÃ¡ trá»‹ runtime Ä‘á»™ng (vÃ­ dá»¥ camera overlay, computed transform Ä‘áº·c biá»‡t).
- KhÃ´ng gáº¯n class trÃ¹ng láº·p dÃ i dÃ²ng á»Ÿ nhiá»u file; pháº£i gom vÃ o shared component hoáº·c helper class náº¿u láº·p láº¡i thá»±c sá»±.
- Má»i class tráº¡ng thÃ¡i pháº£i rÃµ rÃ ng, dá»… truy nguyÃªn.

## 7.2. Component rules

Má»—i shared component báº¯t buá»™c cÃ³:

- `Props` typed rÃµ rÃ ng;
- variant/state Ä‘Æ°á»£c Ä‘á»‹nh nghÄ©a nháº¥t quÃ¡n;
- default behavior rÃµ rÃ ng;
- forward ref náº¿u cáº§n cho form/focus;
- há»— trá»£ `className` hoáº·c slot extension cÃ³ kiá»ƒm soÃ¡t;
- test cho state quan trá»ng;
- docs usage cÆ¡ báº£n.

## 7.3. Hooks rules

- Hook chá»‰ chá»©a logic tráº¡ng thÃ¡i/tÃ¡c vá»¥, khÃ´ng chá»©a JSX.
- Hook khÃ´ng Ä‘Æ°á»£c Ã¢m tháº§m sá»­a UI contract.
- Hook shared pháº£i Ä‘á»™c láº­p feature hoáº·c Ä‘Æ°á»£c Ä‘áº·t trong feature tÆ°Æ¡ng á»©ng.
- KhÃ´ng táº¡o custom hook chá»‰ Ä‘á»ƒ bá»c 2-3 dÃ²ng code náº¿u khÃ´ng tÄƒng Ä‘á»™ rÃµ rÃ ng.

## 7.4. Types rules

- Type dÃ¹ng chung náº±m á»Ÿ nÆ¡i dÃ¹ng chung.
- KhÃ´ng sao chÃ©p interface giá»¯a cÃ¡c file.
- Vá»›i component shared, `Props` lÃ  nguá»“n sá»± tháº­t duy nháº¥t cho API sá»­ dá»¥ng.
- Enum/union cho state pháº£i pháº£n Ã¡nh Ä‘Ãºng contract docs.

## 7.5. State management rules

- State local giá»¯ local náº¿u khÃ´ng cáº§n chia sáº».
- Chá»‰ Ä‘Æ°a lÃªn store/global khi cÃ³ nhiá»u consumer hoáº·c cáº§n Ä‘á»“ng bá»™ xuyÃªn mÃ n hÃ¬nh.
- Tráº¡ng thÃ¡i UI táº¡m thá»i (hover, open, active row) khÃ´ng Ä‘Æ°á»£c Ä‘áº©y lÃªn global store vÃ´ cá»›.

## 7.6. Service/API rules

- TÃ¡ch layer API khá»i component.
- KhÃ´ng gá»i fetch trá»±c tiáº¿p ráº£i rÃ¡c trong nhiá»u component náº¿u cÃ¹ng má»™t nghiá»‡p vá»¥.
- Chuáº©n hÃ³a response mapping vÃ  error handling theo domain.

---

## 8. Chuáº©n riÃªng cho 5 component cá»‘t lÃµi

## 8.1. Button

AI agent pháº£i luÃ´n Ä‘áº£m báº£o:

- há»— trá»£ `variant`, `size`, `isLoading`, `isDisabled`, `leftIcon`, `rightIcon`;
- loading giá»¯ nguyÃªn chiá»u rá»™ng nÃºt;
- active state scale `0.98` náº¿u phÃ¹ há»£p mÃ´i trÆ°á»ng;
- mobile hitbox >= `44px`;
- focus ring rÃµ rÃ ng;
- khÃ´ng táº¡o button â€œna nÃ¡â€ á»Ÿ feature khÃ¡c.

## 8.2. Multiple Choice Option

Báº¯t buá»™c giá»¯:

- toÃ n bá»™ card lÃ  hitbox;
- `single` vÃ  `multiple` pháº£i rÃµ control type;
- selected/correct/wrong cÃ³ mapping semantic thá»‘ng nháº¥t;
- builder mode má»›i Ä‘Æ°á»£c cÃ³ drag handle;
- khÃ´ng tÃ¡ch nhiá»u implementation khÃ¡c nhau cho há»c sinh vÃ  giÃ¡o viÃªn náº¿u cÃ³ thá»ƒ cáº¥u hÃ¬nh báº±ng props/context.

## 8.3. Text Field

Báº¯t buá»™c giá»¯:

- label, placeholder, leading/trailing icon, hint/error text;
- focus border dÃ y hÆ¡n vÃ  cÃ³ ring;
- error state khÃ´ng chá»‰ Ä‘á»•i mÃ u, pháº£i cÃ³ text;
- search field luÃ´n cÃ³ icon kÃ­nh lÃºp theo contract;
- number/password/text/search lÃ  cÃ¡c biáº¿n thá»ƒ cá»§a cÃ¹ng má»™t há» component.

## 8.4. Data Table

Báº¯t buá»™c giá»¯:

- sticky header cho danh sÃ¡ch dÃ i;
- text cÄƒn trÃ¡i, sá»‘ cÄƒn pháº£i;
- hover row cÃ³ ná»n nháº¹;
- standard/compact/expandable lÃ  variant rÃµ rÃ ng;
- sort/select/pagination khÃ´ng Ä‘Æ°á»£c triá»ƒn khai má»—i mÃ n hÃ¬nh má»™t kiá»ƒu.

## 8.5. OMR Scanner Viewfinder

Báº¯t buá»™c giá»¯:

- states: searching, processing, success, error;
- searching cÃ³ animation â€œbreatheâ€;
- success dÃ¹ng success color ngay láº­p tá»©c;
- haptic/sound pháº£i cÃ³ kiá»ƒm soÃ¡t, cÃ³ fallback vÃ  tÃ´n trá»ng quyá»n thiáº¿t bá»‹/trÃ¬nh duyá»‡t;
- má»i UI scanner pháº£i Æ°u tiÃªn tá»‘c Ä‘á»™ nháº­n biáº¿t tráº¡ng thÃ¡i.

---

## 9. Chuáº©n code style vÃ  naming

## 9.1. TÃªn file

- Component: `button.tsx`, `text-field.tsx`
- Hook: `use-omr-scanner.ts` hoáº·c `useOmrScanner.ts` theo chuáº©n repo, nhÆ°ng pháº£i nháº¥t quÃ¡n toÃ n cá»¥c
- Utils: `format-score.ts`
- Constants: `grading-copy.ts`, `routes.ts`

> Chá»n má»™t chuáº©n `kebab-case` hoáº·c `camelCase` cho tÃªn file vÃ  dÃ¹ng thá»‘ng nháº¥t toÃ n repo.

## 9.2. TÃªn prop

Pháº£i Æ°u tiÃªn semantic rÃµ rÃ ng:

- `variant`
- `size`
- `status`
- `disabled`
- `isLoading`
- `error`
- `hint`
- `leftIcon`
- `rightIcon`

## 9.3. Import/export

- Háº¡n cháº¿ circular dependency.
- Shared component cÃ³ thá»ƒ dÃ¹ng barrel export cÃ³ kiá»ƒm soÃ¡t.
- Feature module khÃ´ng import ngÆ°á»£c vÃ o `components/ui`.
- `ui` khÃ´ng phá»¥ thuá»™c business logic.

---

## 10. Chuáº©n accessibility báº¯t buá»™c

AI agent chá»‰ Ä‘Æ°á»£c xem má»™t UI task lÃ  hoÃ n táº¥t náº¿u Ä‘Ã¡p á»©ng tá»‘i thiá»ƒu:

- contrast Ä‘áº¡t baseline AA theo EDS;
- keyboard navigation dÃ¹ng Ä‘Æ°á»£c;
- focus-visible khÃ´ng bá»‹ máº¥t;
- input cÃ³ label rÃµ rÃ ng;
- error message Ä‘á»c hiá»ƒu Ä‘Æ°á»£c;
- icon-only button cÃ³ accessible name;
- tráº¡ng thÃ¡i selected/error/success khÃ´ng chá»‰ truyá»n báº±ng mÃ u;
- reduced motion Ä‘Æ°á»£c tÃ´n trá»ng khi animation Ä‘Ã¡ng ká»ƒ.

---

## 11. Chuáº©n test Ä‘á»ƒ trÃ¡nh code rá»i ráº¡c

## 11.1. Báº¯t buá»™c test theo contract

Má»—i shared component nÃªn cÃ³ test cho:

- render máº·c Ä‘á»‹nh;
- variant chÃ­nh;
- state focus/disabled/loading/error;
- keyboard interaction quan trá»ng;
- aria/semantics cÆ¡ báº£n.

## 11.2. Æ¯u tiÃªn test hÃ nh vi hÆ¡n test implementation

- Test â€œngÆ°á»i dÃ¹ng tháº¥y gÃ¬/lÃ m gÃ¬ Ä‘Æ°á»£câ€;
- TrÃ¡nh test vÃ o chi tiáº¿t class ná»™i bá»™ trá»« khi class chÃ­nh lÃ  contract báº¯t buá»™c;
- Chá»‰ snapshot khi tháº­t sá»± cÃ³ giÃ¡ trá»‹ báº£o vá»‡ contract UI.

## 11.3. Visual regression khi cÃ³ shared UI lá»›n

Ãp dá»¥ng cho:

- Button variants
- Input states
- Data table density
- OMR viewfinder states
- Dark mode / light mode contrast

---

## 12. Chuáº©n tÃ i liá»‡u hÃ³a Ä‘á»ƒ AI agent luÃ´n cáº­p nháº­t Ä‘á»“ng bá»™

Má»—i khi AI agent thay Ä‘á»•i shared UI hoáº·c rule quan trá»ng, pháº£i cáº­p nháº­t tá»‘i thiá»ƒu má»™t trong cÃ¡c nÆ¡i sau tÃ¹y pháº¡m vi:

- `docs/design-system/*`
- `docs/architecture/*`
- `docs/conventions/*`
- `docs/ai-agent/*`
- Story/demo examples

### 12.1. ThÃ nh pháº§n docs tá»‘i thiá»ƒu cho shared component

Má»—i shared component nÃªn cÃ³:

- má»¥c Ä‘Ã­ch sá»­ dá»¥ng;
- khi nÃ o dÃ¹ng / khi nÃ o khÃ´ng dÃ¹ng;
- props;
- variants;
- states;
- accessibility notes;
- vÃ­ dá»¥ code ngáº¯n.

### 12.2. Quy táº¯c khÃ´ng Ä‘á»ƒ docs cháº¿t

Náº¿u code thay Ä‘á»•i nhÆ°ng docs chÆ°a Ä‘á»•i, thay Ä‘á»•i Ä‘Ã³ Ä‘Æ°á»£c xem lÃ  **chÆ°a hoÃ n táº¥t**.

---

## 13. Definition of Done cho AI agent

Má»™t task chá»‰ Ä‘Æ°á»£c coi lÃ  hoÃ n thÃ nh khi thá»a mÃ£n toÃ n bá»™:

1. Ä‘Ãºng yÃªu cáº§u nghiá»‡p vá»¥;
2. khÃ´ng phÃ¡ vá»¡ EDS v3.0;
3. khÃ´ng táº¡o thÃªm pattern UI trÃ¹ng láº·p;
4. token/variant/state Ä‘Æ°á»£c dÃ¹ng Ä‘Ãºng nguá»“n sá»± tháº­t;
5. responsive há»£p lá»‡, touch target Ä‘Ãºng chuáº©n;
6. accessibility há»£p lá»‡ á»Ÿ má»©c tá»‘i thiá»ƒu;
7. code Ä‘Æ°á»£c Ä‘áº·t Ä‘Ãºng layer kiáº¿n trÃºc;
8. types/tests/docs liÃªn quan Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t;
9. khÃ´ng cÃ²n hard-code láº·p láº¡i Ä‘Ã¡ng láº½ pháº£i gom vá» shared layer;
10. tÃªn gá»i, import path, cáº¥u trÃºc thÆ° má»¥c nháº¥t quÃ¡n vá»›i toÃ n repo.

---

## 14. Checklist PR/Review cho AI agent

DÃ¹ng checklist nÃ y cho má»i thay Ä‘á»•i do AI agent táº¡o ra.

### 14.1. Design compliance

- [ ] KhÃ´ng lÃ m lá»‡ch EDS v3.0
- [ ] DÃ¹ng Ä‘Ãºng token mÃ u/typography/motion
- [ ] DÃ¹ng Lucide náº¿u cÃ³ icon
- [ ] Touch target mobile >= 44px
- [ ] Body text mobile >= 16px
- [ ] Responsive theo Bento logic

### 14.2. Architecture compliance

- [ ] Äáº·t file Ä‘Ãºng layer
- [ ] KhÃ´ng táº¡o component trÃ¹ng nghÄ©a
- [ ] KhÃ´ng duplicate type/logic/style
- [ ] Shared logic Ä‘Æ°á»£c trÃ­ch xuáº¥t há»£p lÃ½, khÃ´ng quÃ¡ tay

### 14.3. Component compliance

- [ ] Äá»§ state quan trá»ng
- [ ] API props nháº¥t quÃ¡n
- [ ] Focus/hover/disabled/loading/error hoáº¡t Ä‘á»™ng Ä‘Ãºng
- [ ] Accessibility khÃ´ng bá»‹ bá» sÃ³t

### 14.4. Synchronization compliance

- [ ] ÄÃ£ cáº­p nháº­t type/interface liÃªn quan
- [ ] ÄÃ£ cáº­p nháº­t docs/story/demo liÃªn quan
- [ ] ÄÃ£ cáº­p nháº­t tests liÃªn quan
- [ ] ÄÃ£ rÃ  soÃ¡t call sites bá»‹ áº£nh hÆ°á»Ÿng

---

## 15. Prompt váº­n hÃ nh ngáº¯n cho AI agent

CÃ³ thá»ƒ Ä‘áº·t Ä‘oáº¡n sau á»Ÿ `AGENTS.md`, `CLAUDE.md`, `Cursor Rules` hoáº·c `Copilot Instructions`:

> Báº¡n lÃ  AI coding agent cá»§a project Examxy.  
> Má»i thay Ä‘á»•i pháº£i tuÃ¢n thá»§ EDS v3.0 vÃ  AI Agent Project Guide.  
> KhÃ´ng Ä‘Æ°á»£c tá»± Ã½ tÃ¡i Ä‘á»‹nh nghÄ©a design language.  
> LuÃ´n audit component/tokens/docs/tests hiá»‡n cÃ³ trÆ°á»›c khi viáº¿t code.  
> Æ¯u tiÃªn tÃ¡i sá»­ dá»¥ng pattern hiá»‡n cÃ³, sau Ä‘Ã³ má»›i má»Ÿ rá»™ng báº±ng variant/slot; chá»‰ táº¡o má»›i khi Ä‘Ã£ chá»©ng minh khÃ´ng thá»ƒ dÃ¹ng láº¡i.  
> KhÃ´ng hard-code mÃ u, spacing, typography, motion náº¿u token/theme Ä‘Ã£ tá»“n táº¡i.  
> Má»i thay Ä‘á»•i shared UI pháº£i cáº­p nháº­t Ä‘á»“ng bá»™ code, types, tests, docs vÃ  usage sites.  
> Má»i interactive UI pháº£i Ä‘áº¡t keyboard access, focus-visible, semantic labeling vÃ  mobile touch target tá»‘i thiá»ƒu 44px.  
> Náº¿u phÃ¡t hiá»‡n xung Ä‘á»™t giá»¯a code hiá»‡n táº¡i vÃ  EDS, Æ°u tiÃªn EDS vÃ  Ä‘á» xuáº¥t refactor há»£p nháº¥t.

---

## 16. Káº¿ hoáº¡ch Ã¡p dá»¥ng vÃ o repo hiá»‡n táº¡i

## Giai Ä‘oáº¡n 1 - Chuáº©n hÃ³a ná»n táº£ng

- chá»‘t vá»‹ trÃ­ file token/theme chuáº©n;
- gom cÃ¡c shared primitive vá» `components/ui`;
- chuáº©n hÃ³a prop naming;
- viáº¿t docs ngáº¯n cho 5 component cá»‘t lÃµi.

## Giai Ä‘oáº¡n 2 - Äá»“ng bá»™ feature layer

- thay tháº¿ implementation trÃ¹ng láº·p báº±ng shared component;
- tÃ¡ch business UI vÃ o `features/*`;
- gom copy, types, validation vÃ o nÆ¡i chuáº©n.

## Giai Ä‘oáº¡n 3 - Thiáº¿t láº­p hÃ ng rÃ o cháº¥t lÆ°á»£ng

- thÃªm lint/checklist review;
- thÃªm tests contract cho component shared;
- thÃªm visual review cho state quan trá»ng;
- báº¯t buá»™c update docs khi thay Ä‘á»•i shared layer.

---

## 17. Káº¿t luáº­n

TÃ i liá»‡u nÃ y khÃ´ng táº¡o ra má»™t design system má»›i, mÃ  biáº¿n EDS v3.0 thÃ nh **há»‡ Ä‘iá»u hÃ nh thá»‘ng nháº¥t cho codebase**.  
Khi AI agent tuÃ¢n thá»§ Ä‘Ãºng cÃ¡c rule táº¡i Ä‘Ã¢y, project sáº½ Ä‘áº¡t Ä‘Æ°á»£c 4 lá»£i Ã­ch cá»‘t lÃµi:

1. **Ã­t trÃ¹ng láº·p hÆ¡n**;
2. **dá»… má»Ÿ rá»™ng hÆ¡n**;
3. **UI/UX nháº¥t quÃ¡n hÆ¡n**;
4. **má»i thay Ä‘á»•i Ä‘á»u cÃ³ há»‡ thá»‘ng, khÃ´ng rá»i ráº¡c**.

