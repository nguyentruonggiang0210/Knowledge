for dir in */.git; do
  folder=$(dirname "$dir")
  url=$(git -C "$folder" remote get-url origin 2>/dev/null)
  if [ -n "$url" ]; then
    echo "Đang add submodule cho: $folder ($url)"
    git submodule add "$url" "$folder"
  else
    echo "Thư mục $folder không có remote URL!"
  fi
done