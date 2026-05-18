import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { 
  File, 
  Folder, 
  Upload, 
  Download, 
  Trash2, 
  MoreHorizontal, 
  FileText, 
  Image as ImageIcon,
  Search,
  Grid,
  List as ListIcon,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/src/lib/utils";

interface FileEntry {
  id: string;
  name: string;
  type: string;
  size: number;
  createdAt: string;
  path: string;
}

export default function FileManager() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?userId=${user?.id}`);
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      toast.error("Ошибка загрузки файлов");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append("userId", user?.id || "");
    acceptedFiles.forEach(file => formData.append("files", file));

    try {
      // Simulate progress since standard fetch doesn't support it easily
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error("Ошибка загрузки");
      
      toast.success("Файлы успешно загружены");
      fetchFiles();
    } catch (err) {
      toast.error("Не удалось загрузить файлы");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  }, [user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <ImageIcon className="w-4 h-4 text-pink-500" />;
    if (type.includes("text") || type.includes("json")) return <FileText className="w-4 h-4 text-blue-500" />;
    if (type.includes("python")) return <FileCode className="w-4 h-4 text-amber-500" />;
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Объектное хранилище</h1>
          <p className="text-slate-400">Управляйте скриптами, медиа-ресурсами и конфигурациями ботов</p>
        </div>
        <div className="flex gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className={cn(
              "px-3 rounded-lg transition-all",
              viewMode === "grid" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Grid className="w-4 h-4 mr-2" />
            Сетка
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setViewMode("list")}
            className={cn(
              "px-3 rounded-lg transition-all",
              viewMode === "list" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <ListIcon className="w-4 h-4 mr-2" />
            Список
          </Button>
        </div>
      </div>

      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-2xl p-10 transition-all text-center cursor-pointer
          ${isDragActive ? "border-indigo-500 bg-indigo-500/10" : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xl font-bold text-white uppercase tracking-tight">Загрузить в хранилище</p>
            <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">Нажмите или перетащите файлы сюда для отправки в кластеры (макс. 100 МБ)</p>
          </div>
        </div>
        {isUploading && (
          <div className="mt-8 max-w-md mx-auto space-y-3">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Передача...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </Progress>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-inner">
        <div className="flex items-center flex-1 px-4 gap-3">
          <Search className="w-5 h-5 text-slate-500" />
          <Input 
            placeholder="Поиск ресурсов по имени или расширению..." 
            className="border-none shadow-none focus-visible:ring-0 text-slate-200 placeholder:text-slate-600 bg-transparent h-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        {viewMode === "list" ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50 border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-6 h-12">Имя</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Размер</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Тип</TableHead>
                <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest h-12">Изменен</TableHead>
                <TableHead className="w-[80px] h-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map(file => (
                <TableRow key={file.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                  <TableCell className="font-medium px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {getFileIcon(file.type)}
                      </div>
                      <span className="text-slate-200">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">{formatSize(file.size)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-500 border-slate-800 px-2 py-0.5">
                      {file.type.split("/")[1] || "file"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-white hover:bg-slate-800"><MoreHorizontal className="w-4 h-4" /></Button>
                      } />
                      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200">
                        <DropdownMenuItem className="focus:bg-slate-800 focus:text-indigo-400">
                          <Download className="w-4 h-4 mr-2" /> Скачать
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 focus:bg-red-400/10 focus:text-red-400">
                          <Trash2 className="w-4 h-4 mr-2" /> Удалить навсегда
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-600 italic">
                    Хранилище не содержит активных активов
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 p-6">
            {filteredFiles.map(file => (
              <div key={file.id} className="group relative flex flex-col items-center p-6 border border-slate-800 rounded-2xl bg-slate-800/30 hover:bg-slate-800 transition-all hover:border-slate-600 cursor-pointer text-center">
                <div className="mb-4 transform group-hover:scale-110 transition-transform text-indigo-400 group-hover:text-indigo-300">
                   {getFileIcon(file.type)}
                </div>
                <span className="text-xs font-bold text-slate-200 truncate w-full mb-1 tracking-tight">{file.name}</span>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">{formatSize(file.size)}</span>
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" className="w-6 h-6 p-0 text-slate-400"><MoreHorizontal className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileCode(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13l-2 2 2 2" />
      <path d="M14 17l2-2-2-2" />
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </svg>
  );
}
