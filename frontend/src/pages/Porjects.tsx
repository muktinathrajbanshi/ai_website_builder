import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { Project } from "../types"

const Porjects = () => {

  const { projectId } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const [isGenerating, setIsGenerating] = useState(true)
  const [device, setDevice] = useState<"phone" | "tablet" | "desktop">("desktop")

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchProject = async () => {

  }

  useEffect(() => {
    fetchProject()
  }, [])


  return (
    <div>
      <h1>Projects</h1>
    </div>
  )
}

export default Porjects
