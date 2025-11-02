# NGSS Middle School Life Science Pre-populated Data

## Overview
The application now automatically pre-populates NGSS Middle School Life Science standards when specific conditions are met during the curriculum generation flow.

## Trigger Conditions
The data will automatically load when **ALL** of the following are selected:
1. **Step 2**: State/Provincial Curriculum contains "NGSS" or "Next Generation Science"
2. **Step 3**: Grade Level is one of:
   - 6th grade
   - 7th grade
   - 8th grade
   - All Middle School
3. **Step 4**: Framework/Unit name contains "Life Science"

## Pre-populated Data Structure

### 📚 Step 5: Browse Curriculum Standards
When the conditions above are met, Step 5 will automatically display 4 sections with their complete sub-standards:

#### 1. MS-LS1: From Molecules to Organisms – Structures and Processes
- MS-LS1-1: Cells and Organisms
- MS-LS1-2: Cell Functions
- MS-LS1-3: Body Systems
- MS-LS1-4: Reproductive Strategies
- MS-LS1-5: Growth Factors
- MS-LS1-6: Photosynthesis
- MS-LS1-7: Cellular Respiration

#### 2. MS-LS2: Ecosystems – Interactions, Energy, and Dynamics
- MS-LS2-1: Resource Impact
- MS-LS2-2: Species Interactions
- MS-LS2-3: Energy and Matter Flow
- MS-LS2-4: Ecosystem Disruptions
- MS-LS2-5: Biodiversity Solutions

#### 3. MS-LS3: Heredity – Inheritance and Variation of Traits
- MS-LS3-1: Gene Mutations
- MS-LS3-2: Sexual vs Asexual Reproduction

#### 4. MS-LS4: Biological Evolution – Unity and Diversity
- MS-LS4-1: Fossil Patterns
- MS-LS4-2: Anatomy Evidence
- MS-LS4-3: Embryological Development
- MS-LS4-4: Trait Variation and Survival
- MS-LS4-5: Genetic Modification
- MS-LS4-6: Natural Selection Math

## Testing Instructions

### Quick Test Path
1. **Step 1**: Select USA (or any country)
2. **Step 2**: Select "Next Generation Science Standards (NGSS)" from the state curriculum list
3. **Step 3**: Select "6th grade", "7th grade", "8th grade", or "All Middle School"
4. **Step 4**: Select "Life Science" from the frameworks/units
5. **Observe**: Step 5 should immediately populate with all 4 MS-LS sections and their standards **without needing to click "Generate Sub-standards"**

### Expected Behavior
✅ No API call is made for these sections  
✅ All sub-standards are instantly available  
✅ Success message: "Loaded 4 NGSS MS Life Science sections with standards!"  
✅ Each section is expandable and shows all standards in table format  
✅ You can immediately set lesson counts and generate lessons  

### Fallback Behavior
If the exact conditions are NOT met (e.g., high school grade, different subject), the normal AI generation flow will be used instead.

## Technical Details
- Data Location: `/src/pages/index.tsx` → `NGSS_MS_LIFE_SCIENCE_DATA` constant
- Logic: `handleGenerateCurriculumSections()` function
- Format: Standards follow the same schema as AI-generated sub-standards (code, name, title, description)

## Benefits
- **Instant load**: No waiting for AI generation
- **Consistent quality**: Official NGSS standard codes and descriptions
- **Token savings**: No API usage for these common middle school life science standards
- **Always available**: Works even if OpenAI API is down or rate-limited
