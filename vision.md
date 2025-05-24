Here’s a clear and structured draft of the requirements for your interactive website that compares the financial data of different governmental entities (e.g., villages, cantons):

---

## **Project Requirements: Interactive Government Finance Comparison Website**

### **1. Project Overview**

The goal is to create an easy-to-use, interactive website that allows users to compare the financial data of different governmental entities in Switzerland (e.g., villages, cities, cantons). The platform should provide visual insights into how entities generate and allocate their resources, enabling transparent, accessible, and meaningful comparisons.

---

### **2. Core Features**

#### **2.1 Entity Comparison**

* Allow users to select **two or more entities** (villages, cities, cantons).
* Enable comparison across **key financial indicators**, such as:

    * Revenue sources (e.g., taxes, transfers, fees)
    * Expenditure categories (e.g., education, health, infrastructure)
    * Budget vs actuals (if available)
    * Debt level and reserves
    * Per capita metrics

#### **2.2 Cantonal Context**

* Include **cantonal-level financial data** as contextual information for each entity.
* Allow comparison **within a canton**, **between cantons**, or **across the entire country**.

#### **2.3 Visualizations**

* Support **interactive graphs** such as:

    * Bar charts, pie charts, and stacked bar charts
    * Line charts (for trends over time)
    * Maps with color-coded overlays (e.g., tax rates, expenditures per capita)
* Users should be able to:

    * Hover for tooltips
    * Click to filter or drill down
    * Export charts as images or PDF

#### **2.4 Data Sources and Updates**

* Import data from **official finance statistics** (e.g., BFS, cantonal databases).
* Data must be **updated regularly** (e.g., annually or as published).
* Show the **source and date** of each data set clearly.

---

### **3. Usability Requirements**

#### **3.1 User Interface**

* Simple and intuitive layout:

    * Clear navigation
    * Smart search and filters for finding entities
    * Comparison view with side-by-side panels
* Responsive design for desktop, tablet, and mobile

#### **3.2 Accessibility**

* Comply with WCAG 2.1 AA accessibility standards
* Provide text alternatives for visual content
* Ensure keyboard navigation and screen reader compatibility

---

### **4. Technical Requirements**

#### **4.1 Backend**

* Scalable API to serve financial data
* Support filters by:

    * Year
    * Entity type (village, city, canton)
    * Geography (e.g., canton, region)
    * Metric type (income, spending, debt)

#### **4.2 Frontend**

* Modern JS framework (e.g., React or Vue)
* Data visualization using D3.js, Chart.js or similar
* Optional: Map integration using Leaflet or Mapbox

#### **4.3 Admin & Data Management**

* Backend interface for data upload and validation
* Version control or audit trail for published data

---

### **5. Additional Features (Nice-to-Have)**

* Save and share comparisons via unique URLs
* Embed charts in external websites
* User accounts for saving comparisons or creating dashboards
* Download raw data as CSV or Excel

---

### **6. Constraints & Assumptions**

* Only public, non-sensitive data will be displayed.
* Project assumes data availability in structured, machine-readable formats.
* Site will be available in at least German and French; English optional.
