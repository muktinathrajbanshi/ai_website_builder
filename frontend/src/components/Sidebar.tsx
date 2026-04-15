import type { Project } from "../types";

interface SidebarProps {
    isMenuOpen: boolean;
    project: Project,
    setProject: (project: Project) => void;
    isGenerating: boolean;
    SetIsGenerating: (project: boolean) => void;
}

const Sidebar = ({isMenuOpen, project, setProject, isGenerating, setIsGenerating} : 
    SidebarProps) => {
  return (
    <div className={`h-full sm:max-w-sm rounded-xl bg-gray-900 border-gray-800
    transition-all ${isMenuOpen ? "max-sm:w-0 overflow-hidden" : "w-full"}`}>
      
    </div>
  )
}

export default Sidebar
