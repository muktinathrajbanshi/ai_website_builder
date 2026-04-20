import { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import openai from "../configs/openai.js";


/* =========================================================
   MAKE REVISION
========================================================= */
export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;

    try {
        const projectId = req.params.projectId;
        const message = req.body.message;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!message || message.trim() === "") {
            return res.status(400).json({ message: "Please enter a valid prompt" });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (user.credits < 5) {
            return res.status(403).json({ message: "Not enough credits" });
        }

        const currentProject = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId: userId
            },
            include: { versions: true }
        });

        if (!currentProject) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Save user message
        await prisma.conversation.create({
            data: {
                role: "user",
                content: message,
                projectId
            }
        });

        // Enhance prompt
        const promptEnhanceResponse = await openai.chat.completions.create({
            model: "qwen/qwen3-coder:free",
            messages: [
                {
                    role: "system",
                    content: "Enhance user request for web development."
                },
                {
                    role: "user",
                    content: message
                }
            ]
        });

        const enhancedPrompt =
            promptEnhanceResponse.choices?.[0]?.message?.content ?? message;

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: enhancedPrompt,
                projectId
            }
        });

        // Generate code
        const codeResponse = await openai.chat.completions.create({
            model: "qwen/qwen3-coder:free",
            messages: [
                {
                    role: "system",
                    content: "Return ONLY clean HTML with Tailwind CSS."
                },
                {
                    role: "user",
                    content: `Code: ${currentProject.current_code}
Change: ${enhancedPrompt}`
                }
            ]
        });

        const rawCode = codeResponse.choices?.[0]?.message?.content || "";

        if (!rawCode) {
            return res.status(500).json({ message: "Code generation failed" });
        }

        const cleanCode = rawCode
            .replace(/```[a-z]*\n?/gi, "")
            .replace(/```$/g, "")
            .trim();

        // Create version
        const version = await prisma.version.create({
            data: {
                code: cleanCode,
                description: "revision update",
                projectId
            }
        });

        // Update project
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: cleanCode,
                current_version_index: version.id
            }
        });

        // Deduct credits AFTER success
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        });

        return res.json({ message: "Revision completed successfully" });

    } catch (error: any) {
        console.log(error.message);
        return res.status(500).json({ message: error.message });
    }
};

/* =========================================================
   ROLLBACK VERSION
========================================================= */
export const rollbackToVersion = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId;
        const versionId = req.params.versionId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId
            },
            include: { versions: true }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const version = project.versions.find(v => v.id === versionId);

        if (!version) {
            return res.status(404).json({ message: "Version not found" });
        }

        await prisma.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        });

        await prisma.conversation.create({
            data: {
                role: "assistant",
                content: "Rolled back successfully",
                projectId
            }
        });

        res.json({ message: "Rollback successful" });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================================================
   DELETE PROJECT
========================================================= */
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId
            }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        await prisma.websiteProject.delete({
            where: { id: projectId }
        });

        res.json({ message: "Project deleted successfully" });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

/* =========================================================
   GET PROJECT PREVIEW
========================================================= */
export const getProjectPreview = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = req.params.projectId;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const project = await prisma.websiteProject.findFirst({
            where: {
                id: projectId,
                userId
            },
            include: { versions: true }
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ project });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getPublishedProjects = async (req: Request, res: Response) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: { versions: true }
        });

        res.json({ projects });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};