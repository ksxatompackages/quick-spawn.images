node ./sh/preview.js && (
  [ -f ./sh/previewer.sh ] && (
    (
      ./sh/previewer.sh .preview.html && echo '(WARNING) Preview failed'
    ) &
  ) || (
    echo '(WARNING) No previewer specified'
  )
)
