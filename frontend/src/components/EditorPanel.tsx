import { useEffect, useState } from "react";

interface EditorPanelProps {
    selectedElement: {
        tagName: string;
        className: string;
        text: string;
        styles: {
            padding: string;
            margin: string;
            backgroundColor: string;
            color: string;
            fontSize: string
        };
    } | null;
    onUpdate: (updates: any) => void;
    onClose: () => void;

}

const EditorPanel = ({ selectedElement, onUpdate, onClose }: EditorPanelProps) => {

    const [values, setValues] = useState(selectedElement)

    useEffect(() => {
        setValues(selectedElement)
    }, [])

  return (
    <div>
      
    </div>
  )
}

export default EditorPanel
