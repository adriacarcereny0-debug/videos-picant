"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Alert, Button, Field, LevelBadge, StatusPill, inputClass } from "@/components/ui";
import { IconClose, IconEdit, IconSearch, IconStar, IconTrash, IconUpload } from "@/components/icons";
import { formatDate, formatDuration } from "@/lib/format";

export interface AdminVideo {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnailUrl: string;
  durationSeconds: number;
  subscriptionLevel: "BASIC" | "PREMIUM";
  status: "DRAFT" | "PUBLISHED";
  sortOrder: number;
  featured: boolean;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
}

/**
 * `direct`: el fichero sube del navegador al almacenamiento privado sin pasar
 * por la función (obligatorio en Vercel, que limita el cuerpo a 4,5 MB).
 * `inline`: el fichero viaja en la petición. Solo en desarrollo local.
 */
export type UploadMode = "direct" | "inline";

type Filter = "ALL" | "BASIC" | "PREMIUM" | "DRAFT" | "PUBLISHED" | "FEATURED";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: "FEATURED", label: "Portada" },
  { key: "BASIC", label: "Básico" },
  { key: "PREMIUM", label: "Premium" },
  { key: "PUBLISHED", label: "Publicados" },
  { key: "DRAFT", label: "Borradores" },
];

/** Campos de la ficha, compartidos por las dos vías de guardado. */
function metadataFrom(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    category: String(formData.get("category") || "General"),
    subscriptionLevel: String(formData.get("subscriptionLevel") ?? "BASIC"),
    status: String(formData.get("status") ?? "DRAFT"),
    durationSeconds: Number(formData.get("durationSeconds") ?? 0),
    publishedAt: String(formData.get("publishedAt") ?? ""),
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    featured: formData.get("featured") === "on",
  };
}

export function VideoManager({
  videos,
  openUpload = false,
  uploadMode,
}: {
  videos: AdminVideo[];
  openUpload?: boolean;
  uploadMode: UploadMode;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<
    { mode: "create" } | { mode: "edit"; video: AdminVideo } | null
  >(openUpload ? { mode: "create" } : null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "FEATURED" && video.featured) ||
        (filter === "BASIC" && video.subscriptionLevel === "BASIC") ||
        (filter === "PREMIUM" && video.subscriptionLevel === "PREMIUM") ||
        (filter === "DRAFT" && video.status === "DRAFT") ||
        (filter === "PUBLISHED" && video.status === "PUBLISHED");
      const matchesSearch = !term || video.title.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [videos, filter, search]);

  const featuredCount = videos.filter((v) => v.featured && v.status === "PUBLISHED").length;

  /** Guardado rápido de un único campo, reutilizando la ficha existente. */
  async function patchVideo(video: AdminVideo, changes: Partial<AdminVideo>) {
    setBusyId(video.id);
    setError(null);

    const response = await fetch(`/api/admin/videos/${video.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: video.title,
        description: video.description,
        category: video.category,
        subscriptionLevel: video.subscriptionLevel,
        status: video.status,
        durationSeconds: video.durationSeconds,
        sortOrder: video.sortOrder,
        featured: video.featured,
        publishedAt: video.publishedAt
          ? new Date(video.publishedAt).toISOString().slice(0, 16)
          : "",
        ...changes,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "No se ha podido actualizar el vídeo.");
    }

    setBusyId(null);
    router.refresh();
  }

  async function move(video: AdminVideo, direction: -1 | 1) {
    const ordered = [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((item) => item.id === video.id);
    const target = index + direction;
    if (target < 0 || target >= ordered.length) return;

    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];

    setBusyId(video.id);
    await fetch("/api/admin/videos/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: ordered.map((item, position) => ({ id: item.id, sortOrder: position })),
      }),
    }).catch(() => undefined);
    setBusyId(null);
    router.refresh();
  }

  async function remove(video: AdminVideo) {
    if (!window.confirm(`¿Eliminar «${video.title}»? Esta acción no se puede deshacer.`)) return;
    setBusyId(video.id);
    const response = await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "No se ha podido eliminar el vídeo.");
    }
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {error && <Alert tone="danger">{error}</Alert>}

      {featuredCount === 0 && videos.length > 0 && (
        <Alert tone="warning">
          No hay ningún vídeo marcado como portada. La landing mostrará su composición por
          defecto. Marca uno con la estrella para usar su imagen como portada.
        </Alert>
      )}

      {/* Controles */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`focus-ring shrink-0 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-all ${
                filter === item.key
                  ? "border-aurum/50 bg-aurum/12 text-aurum-soft"
                  : "border-line text-ink-muted hover:text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1 lg:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint">
              <IconSearch width={16} height={16} />
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar vídeos"
              aria-label="Buscar vídeos"
              className="w-full rounded-full border border-line bg-[#0d0d11] py-2.5 pl-10 pr-4 text-[13px] text-ink placeholder:text-ink-faint focus:border-aurum/50 focus:outline-none"
            />
          </div>
          <Button size="sm" onClick={() => setEditor({ mode: "create" })} className="shrink-0">
            <IconUpload width={15} height={15} />
            Subir vídeo
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="surface overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                <th className="px-5 py-3.5 font-bold">Vídeo</th>
                <th className="px-3 py-3.5 font-bold">Nivel</th>
                <th className="px-3 py-3.5 font-bold">Estado</th>
                <th className="px-3 py-3.5 font-bold">Fecha</th>
                <th className="px-3 py-3.5 text-right font-bold">Reprod.</th>
                <th className="px-5 py-3.5 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((video) => (
                <tr key={video.id} className="border-b border-line-soft last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-elevated">
                        {video.thumbnailUrl && (
                          <Image
                            src={video.thumbnailUrl}
                            alt=""
                            fill
                            unoptimized
                            sizes="80px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/videos/${video.id}`}
                            className="block max-w-[240px] truncate font-medium text-ink hover:text-aurum"
                          >
                            {video.title}
                          </Link>
                          {video.featured && (
                            <span className="shrink-0 text-aurum" title="Portada">
                              <IconStar width={13} height={13} filled />
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-faint">
                          {video.category} · {formatDuration(video.durationSeconds)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5">
                    <LevelBadge level={video.subscriptionLevel} />
                  </td>
                  <td className="px-3 py-3.5">
                    <StatusPill tone={video.status === "PUBLISHED" ? "positive" : "neutral"}>
                      {video.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-3.5 text-[13px] text-ink-muted">
                    {formatDate(video.publishedAt ?? video.createdAt)}
                  </td>
                  <td className="px-3 py-3.5 text-right text-[13px] tabular-nums text-ink-muted">
                    {video.viewCount.toLocaleString("es-ES")}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        label={video.featured ? "Quitar de portada" : "Usar como portada"}
                        active={video.featured}
                        onClick={() => patchVideo(video, { featured: !video.featured })}
                        disabled={busyId === video.id}
                      >
                        <IconStar width={15} height={15} filled={video.featured} />
                      </IconButton>
                      <IconButton
                        label="Subir en el orden"
                        onClick={() => move(video, -1)}
                        disabled={busyId === video.id}
                      >
                        ↑
                      </IconButton>
                      <IconButton
                        label="Bajar en el orden"
                        onClick={() => move(video, 1)}
                        disabled={busyId === video.id}
                      >
                        ↓
                      </IconButton>
                      <button
                        type="button"
                        onClick={() =>
                          patchVideo(video, {
                            status: video.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED",
                          })
                        }
                        disabled={busyId === video.id}
                        className="focus-ring rounded-full border border-line px-3 py-1.5 text-[11px] font-semibold text-ink-muted transition-colors hover:border-aurum/40 hover:text-ink disabled:opacity-40"
                      >
                        {video.status === "PUBLISHED" ? "Despublicar" : "Publicar"}
                      </button>
                      <IconButton
                        label="Editar"
                        onClick={() => setEditor({ mode: "edit", video })}
                        disabled={busyId === video.id}
                      >
                        <IconEdit width={15} height={15} />
                      </IconButton>
                      <IconButton
                        label="Eliminar"
                        danger
                        onClick={() => remove(video)}
                        disabled={busyId === video.id}
                      >
                        <IconTrash width={15} height={15} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}

              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-ink-faint">
                    No hay vídeos que coincidan con el filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editor && (
        <VideoEditor
          mode={editor.mode}
          uploadMode={uploadMode}
          video={editor.mode === "edit" ? editor.video : undefined}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`focus-ring grid h-8 w-8 place-items-center rounded-lg border text-[12px] transition-colors disabled:opacity-40 ${
        active
          ? "border-aurum/45 bg-aurum/12 text-aurum"
          : danger
            ? "border-line text-ink-faint hover:border-danger/40 hover:text-danger"
            : "border-line text-ink-muted hover:border-aurum/40 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

/* --------------------------- Editor / subida -------------------------- */

function VideoEditor({
  mode,
  uploadMode,
  video,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  uploadMode: UploadMode;
  video?: AdminVideo;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");

  /** Subida directa al almacenamiento privado desde el navegador. */
  async function uploadDirect(file: File, folder: "videos" | "thumbnails", reference: string) {
    const { upload } = await import("@vercel/blob/client");
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const pathname = `${folder}/${reference}/${folder === "videos" ? "video" : "thumbnail"}-${Date.now()}.${extension}`;

    const result = await upload(pathname, file, {
      access: "private",
      handleUploadUrl: "/api/admin/upload-token",
      multipart: file.size > 8 * 1024 * 1024,
      onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
    });

    return result.pathname;
  }

  async function submit(formData: FormData) {
    setError(null);
    setSaving(true);
    setProgress(0);

    const endpoint = mode === "create" ? "/api/admin/videos" : `/api/admin/videos/${video!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const videoFile = formData.get("video");
      const thumbnailFile = formData.get("thumbnail");

      if (uploadMode === "direct") {
        const reference = crypto.randomUUID();
        const body: Record<string, unknown> = metadataFrom(formData);

        if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
          setStage("Subiendo miniatura");
          body.thumbnailKey = await uploadDirect(thumbnailFile, "thumbnails", reference);
        }

        if (mode === "create") {
          if (!(videoFile instanceof File) || videoFile.size === 0) {
            throw new Error("Selecciona el archivo de vídeo.");
          }
          setStage("Subiendo vídeo");
          setProgress(0);
          body.videoKey = await uploadDirect(videoFile, "videos", reference);
        }

        setStage("Guardando ficha");
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Error al guardar el vídeo.");
      } else {
        // Desarrollo local: el fichero viaja en la petición, con progreso real.
        setStage("Subiendo");
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(method, endpoint);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setProgress(Math.round((event.loaded / event.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) return resolve();
            try {
              reject(new Error(JSON.parse(xhr.responseText).error ?? "Error al guardar."));
            } catch {
              reject(new Error("Error al guardar el vídeo."));
            }
          };
          xhr.onerror = () => reject(new Error("Error de red durante la subida."));
          xhr.send(formData);
        });
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
      setSaving(false);
      setStage("");
    }
  }

  return (
    <div
      className="fade-in fixed inset-0 z-[60] overflow-y-auto bg-obsidian/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "create" ? "Subir vídeo" : "Editar vídeo"}
    >
      <div className="surface-flat rise mx-auto my-8 w-full max-w-2xl p-6 sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-ink">
              {mode === "create" ? "Subir vídeo" : "Editar vídeo"}
            </h2>
            <p className="mt-1 text-[13px] text-ink-muted">
              {uploadMode === "direct"
                ? "El archivo sube directamente al almacenamiento privado, sin pasar por el servidor."
                : "El archivo se guarda en el almacenamiento local privado."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="focus-ring grid h-9 w-9 place-items-center rounded-full text-ink-faint hover:bg-white/5 hover:text-ink"
          >
            <IconClose width={17} height={17} />
          </button>
        </div>

        <form action={submit} className="space-y-5">
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Título" htmlFor="title">
            <input
              id="title"
              name="title"
              required
              maxLength={140}
              defaultValue={video?.title}
              className={inputClass}
              placeholder="Título del vídeo"
            />
          </Field>

          <Field label="Descripción" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={4000}
              defaultValue={video?.description}
              className={`${inputClass} resize-none`}
              placeholder="Descripción que verán los suscriptores"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="category">
              <input
                id="category"
                name="category"
                maxLength={60}
                defaultValue={video?.category ?? "General"}
                className={inputClass}
              />
            </Field>

            <Field
              label="Duración (segundos)"
              htmlFor="durationSeconds"
              hint="Se muestra en la tarjeta del catálogo."
            >
              <input
                id="durationSeconds"
                name="durationSeconds"
                type="number"
                min={0}
                max={86400}
                defaultValue={video?.durationSeconds ?? 0}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nivel de acceso" htmlFor="subscriptionLevel">
              <select
                id="subscriptionLevel"
                name="subscriptionLevel"
                defaultValue={video?.subscriptionLevel ?? "BASIC"}
                className={inputClass}
              >
                <option value="BASIC">Básico</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </Field>

            <Field label="Estado" htmlFor="status">
              <select
                id="status"
                name="status"
                defaultValue={video?.status ?? "DRAFT"}
                className={inputClass}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Fecha de publicación"
              htmlFor="publishedAt"
              hint="Vacío = ahora al publicar."
            >
              <input
                id="publishedAt"
                name="publishedAt"
                type="datetime-local"
                defaultValue={
                  video?.publishedAt
                    ? new Date(video.publishedAt).toISOString().slice(0, 16)
                    : ""
                }
                className={inputClass}
              />
            </Field>

            <Field label="Orden" htmlFor="sortOrder" hint="Menor número, más arriba.">
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min={0}
                max={9999}
                defaultValue={video?.sortOrder ?? 0}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={video?.featured ?? false}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line bg-elevated accent-[#c8a063]"
            />
            <span className="text-[13px] leading-relaxed text-ink-muted">
              <strong className="font-semibold text-ink">Usar como portada</strong> — su imagen
              aparecerá en la cabecera de la página de inicio. Si marcas varios, la portada irá
              rotando entre ellos.
            </span>
          </label>

          <div className="hairline" />

          <Field
            label="Miniatura"
            htmlFor="thumbnail"
            hint={
              mode === "edit"
                ? "Opcional: súbela solo si quieres reemplazar la actual. JPG, PNG, WebP o AVIF (máx. 8 MB)."
                : "Se usa en el catálogo y, si marcas la portada, en la cabecera. Formato apaisado 16:9 recomendado."
            }
          >
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required={mode === "create"}
              className="w-full rounded-xl border border-line bg-[#0d0d11] px-4 py-3 text-[13px] text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-aurum file:px-4 file:py-1.5 file:text-[12px] file:font-bold file:text-obsidian"
            />
          </Field>

          {mode === "create" && (
            <Field
              label="Archivo de vídeo"
              htmlFor="video"
              hint="MP4, WebM o MOV (máx. 2 GB). Se almacena en privado; nunca tendrá una URL pública."
            >
              <input
                id="video"
                name="video"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                required
                className="w-full rounded-xl border border-line bg-[#0d0d11] px-4 py-3 text-[13px] text-ink-muted file:mr-4 file:rounded-full file:border-0 file:bg-aurum file:px-4 file:py-1.5 file:text-[12px] file:font-bold file:text-obsidian"
              />
            </Field>
          )}

          {saving && (
            <div>
              <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-aurum transition-all duration-300"
                  style={{ width: `${Math.max(progress, 3)}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-ink-faint">
                {stage}
                {progress > 0 ? ` · ${progress}%` : "…"}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button type="submit" size="lg" disabled={saving} full>
              {saving ? "Guardando…" : mode === "create" ? "Subir vídeo" : "Guardar cambios"}
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
