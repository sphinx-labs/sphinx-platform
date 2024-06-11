list=(7297 7298 7299 7300 42111 42420 42614 42097 42001 42200 42001 42010 42161 42141 3000)

for i in "${list[@]}"
do
    pid=$(lsof -t -i:$i)
    if [ ! -z "$pid" ]
    then
      echo "Killing process $pid listening on port $i"
      kill $pid
    else
      echo "No process running on port $i"
    fi
done