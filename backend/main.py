import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.models.schemas import (
    CounterfactualRequest, OptimizationRequest
)
from backend.services.patient_service import PatientService
from backend.services.hospital_service import HospitalService
from backend.services.simulation_service import SimulationService
from backend.services.optimizer_service import OptimizerService
from backend.services.graph_service import GraphService

app = FastAPI(
    title="CareGraph API",
    description="AI Clinical Risk & Hospital Resource Digital Twin (VJ Hackathon 2026)",
    version="1.0.0"
)

# Enable CORS for local development & frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "system": "CareGraph Digital Twin Engine",
        "version": "1.0.0",
        "hackathon": "VJ Hackathon 2026"
    }

@app.get("/api/patients")
def get_patients():
    return PatientService.get_all_patients()

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str):
    patient = PatientService.get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient digital twin not found")
    return patient

@app.get("/api/hospital/state")
def get_hospital_state():
    return HospitalService.get_current_state()

@app.post("/api/simulate/counterfactual")
def simulate_counterfactual(req: CounterfactualRequest):
    return SimulationService.run_counterfactual_simulation(req)

@app.post("/api/optimize/resources")
def optimize_resources(req: OptimizationRequest):
    return OptimizerService.solve_resource_allocation(req)

@app.get("/api/knowledge-graph")
def get_knowledge_graph():
    return GraphService.get_full_clinical_knowledge_graph()

# Mount frontend if available in directory
frontend_dir = os.path.join(os.path.dirname(__file__), "..", "frontend")
if os.path.isdir(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

    @app.get("/")
    def serve_frontend_root():
        index_file = os.path.join(frontend_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CareGraph API is running. Access /docs for Swagger UI."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
