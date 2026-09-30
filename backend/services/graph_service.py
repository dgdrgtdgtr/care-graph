from typing import Dict, Any, List
from backend.services.patient_service import PatientService

class GraphService:
    @staticmethod
    def get_full_clinical_knowledge_graph() -> Dict[str, Any]:
        """
        Builds the integrated heterogeneous clinical knowledge graph:
        Patient -> Condition -> Lab -> Medication -> Risk Factor -> Complication -> Resource
        """
        all_nodes = []
        all_edges = []
        node_ids = set()

        patients = PatientService.get_all_patients()
        for pt in patients:
            for n in pt.subgraph_nodes:
                if n.id not in node_ids:
                    node_ids.add(n.id)
                    all_nodes.append({
                        "id": n.id,
                        "label": n.label,
                        "category": n.category,
                        "details": n.details
                    })
            for e in pt.subgraph_edges:
                all_edges.append({
                    "source": e.source,
                    "target": e.target,
                    "relationship": e.relationship
                })

        # Add cross-hospital operational links
        hospital_nodes = [
            {"id": "r_resus_bay", "label": "ED Resuscitation Bay 1", "category": "resource", "details": "Trauma & acute stabilization"},
            {"id": "r_pharm_iv", "label": "Central Inpatient Pharmacy", "category": "resource", "details": "Pressor compounding & antibiotics"},
            {"id": "c_hypotension", "label": "Refractory Hypotension", "category": "complication", "details": "MAP < 65 despite fluid loading"},
            {"id": "m_hydrocort", "label": "Hydrocortisone Stress Dose", "category": "medication", "details": "Refractory shock protocol"}
        ]
        for hn in hospital_nodes:
            if hn["id"] not in node_ids:
                node_ids.add(hn["id"])
                all_nodes.append(hn)

        hospital_edges = [
            {"source": "c_shock", "target": "c_hypotension", "relationship": "manifests_as"},
            {"source": "c_hypotension", "target": "m_hydrocort", "relationship": "requires"},
            {"source": "m_norepi", "target": "r_pharm_iv", "relationship": "supplied_by"},
            {"source": "pt_b", "target": "r_resus_bay", "relationship": "monitored_by"}
        ]
        all_edges.extend(hospital_edges)

        return {
            "total_nodes": len(all_nodes),
            "total_edges": len(all_edges),
            "nodes": all_nodes,
            "edges": all_edges
        }
