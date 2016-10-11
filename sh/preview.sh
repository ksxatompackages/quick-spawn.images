node ./sh/preview.js && (
  [ -f ./sh/previewer.sh ] && (
    (
      ./sh/previewer.sh .preview.html || echo '(WARNING) Preview failed' >&2
    ) &
  ) || (
    echo '(WARNING) No previewer specified' >&2
  )
)
