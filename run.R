library(plumber)
pr <- plumb("app.R")
pr$run(port = 8000)