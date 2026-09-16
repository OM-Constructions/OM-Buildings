const documentsData = [
    {
        id: "raj-01",
        number: "01",
        title: "Centerline Marking Details",
        category: "Structural / Foundation",
        description: "Foundation centerline setting-out plan showing grid lines, column positions, and column sizes for the residential building.",
        revision: "R0",
        file: "./assets/documents/project-1/centerline-marking-details.pdf"
    },
    {
        id: "raj-02",
        number: "02",
        title: "Footing Excavation Details",
        category: "Structural / Foundation",
        description: "Foundation excavation layout showing footing pits, combined footings, and sump excavation dimensions for the residential building.",
        revision: "R1",
        file: "./assets/documents/project-1/footing-excavation-details-r1.pdf"
    },
    {
        id: "raj-03",
        number: "03",
        title: "Column Reinforcement Details",
        category: "Structural",
        description: "Column reinforcement schedule showing bar sizes, spacing, and concrete grades for all floor levels of the residential building.",
        revision: "R0",
        file: "./assets/documents/project-1/column-reinforcement-details.pdf"
    },
    {
        id: "raj-04",
        number: "04",
        title: "Plinth Beam Details",
        category: "Structural",
        description: "Plinth beam layout and cross-section details showing beam sizes, reinforcement, and staircase dowel provisions.",
        revision: "R0",
        file: "./assets/documents/project-1/plinth-beam-details.pdf"
    },
    {
        id: "raj-11",
        number: "11",
        title: "Geotechnical Investigation Report",
        category: "Geotechnical / Engineering Reports",
        description: "Detailed soil investigation report with borehole logs, SPT values, laboratory test results, and foundation recommendations for the G+3 residential building.",
        revision: "Report No. SI/GR/027/2026",
        file: "./assets/documents/project-1/geotechnical-investigation-report.pdf"
    },
    {
        id: "raj-13",
        number: "13",
        title: "First & Second Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Combined architectural floor plan showing residential units, living and dining areas, bedrooms, kitchen, toilets, balconies, lift shaft, lobby, staircase, and dimensions.",
        revision: "R1",
        file: "./assets/documents/project-1/first-second-floor-plan-r1.pdf"
    },
    {
        id: "raj-14",
        number: "14",
        title: "Terrace Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Terrace-level architectural plan showing living areas, dining, kitchen, bedrooms, prayer room, toilets, balcony, foyer, lift shaft, and staircase.",
        revision: "R0",
        file: "./assets/documents/project-1/terrace-floor-plan-r0.pdf"
    },
    {
        id: "raj-15",
        number: "15",
        title: "Terrace Floor Plan — Option 2",
        category: "Architectural / Floor Plans",
        description: "Alternative terrace-level architectural layout showing revised living and dining areas, bedrooms, prayer room, kitchen, toilets, powder room, balconies, and circulation.",
        revision: "R0 — Option 2",
        file: "./assets/documents/project-1/terrace-floor-plan-option-2-r0.pdf"
    },
    
    // PROJECT 2
    {
        id: "chan-10",
        number: "10",
        title: "First Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Architectural floor plan showing residential units, bedrooms, living areas, kitchen, toilets, staircase, openings, dimensions, and area information.",
        revision: null,
        file: "./assets/documents/project-2/first-floor-plan.pdf"
    },
    {
        id: "chan-05",
        number: "05",
        title: "Second Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Architectural floor plan showing residential units, room layouts, circulation, staircase, openings, dimensions, and area information.",
        revision: null,
        file: "./assets/documents/project-2/second-floor-plan.pdf"
    },
    {
        id: "chan-06",
        number: "06",
        title: "Third Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Architectural floor plan showing residential units, room layouts, circulation, staircase, openings, dimensions, and area information.",
        revision: null,
        file: "./assets/documents/project-2/third-floor-plan.pdf"
    },
    {
        id: "chan-07",
        number: "07",
        title: "Fourth Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Architectural floor plan showing residential units with an open-to-sky area, curved staircase arrangement, room layouts, openings, and dimensions.",
        revision: null,
        file: "./assets/documents/project-2/fourth-floor-plan.pdf"
    },
    {
        id: "chan-08",
        number: "08",
        title: "Fifth Floor Plan",
        category: "Architectural / Floor Plans",
        description: "Architectural floor plan featuring larger bedroom areas, a prayer room, family sit-out, living areas, staircase, openings, and dimensions.",
        revision: null,
        file: "./assets/documents/project-2/fifth-floor-plan.pdf"
    },
    {
        id: "chan-12",
        number: "12",
        title: "Ground Floor Specifications & Notes",
        category: "Architectural / Technical Specifications",
        description: "Ground-floor technical specifications covering underground sump, lift, staircase, parking, compound wall, entrance gate, and related construction requirements.",
        revision: null,
        file: "./assets/documents/project-2/ground-floor-specifications-notes.pdf"
    }
];

document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("docs-grid");
    const categorySelect = document.getElementById("doc-category-select");

    let currentCategory = "all";

    function renderCards() {
        grid.innerHTML = "";
        
        let filtered = documentsData;
        if (currentCategory !== "all") {
            filtered = filtered.filter(d => d.category === currentCategory);
        }

        if (filtered.length === 0) {
            grid.innerHTML = "<p style='grid-column: 1 / -1; text-align: center; color: #666;'>No documents found for the selected filters.</p>";
            return;
        }

        filtered.forEach(doc => {
            const card = document.createElement("div");
            card.className = "doc-card";
            card.innerHTML = `
                <div class="doc-badge">${doc.category}</div>
                <div class="doc-content">
                    <div class="doc-number">DOCUMENT ${doc.number}</div>
                    <h3 class="doc-title">${doc.title}</h3>
                    <p class="doc-desc">${doc.description}</p>
                    ${doc.revision ? `<div class="doc-rev">REVISION: ${doc.revision}</div>` : ""}
                </div>
                <div class="doc-actions">
                    <a href="${doc.file}" target="_blank" class="doc-btn">VIEW DOCUMENT &rarr;</a>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    categorySelect.addEventListener("change", (e) => {
        currentCategory = e.target.value;
        renderCards();
    });

    // Initial Render
    renderCards();
});
