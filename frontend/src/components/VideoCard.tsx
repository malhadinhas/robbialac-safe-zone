  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">{video.title}</div>
        {video.isNew && (
          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
            Novo
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500">
        {video.duration ? `${video.duration} min` : "Duração não disponível"}
      </div>
    </div>
    <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <EyeIcon className="h-4 w-4" />
        {video.views} visualizações
      </div>
      <div>•</div>
      <div>{video.uploadDate}</div>
    </div>
  </div> 