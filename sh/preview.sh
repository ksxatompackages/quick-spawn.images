node ./sh/preview.js && (
  {
    [ -f ./sh/previewer.sh ] &&
    export PREVIEWER=$(./sh/previewer.sh) &&
    [ ! -z $PREVIEWER ]
  } && (
    ( "$PREVIEWER" .preview.html || echo '(WARNING) Preview failed' >&2 ) &
  ) || (
    echo '(WARNING) No previewer specified' >&2
  )
)
