library(plumber)
library(class)
library(jsonlite)

# Global data storage
user_dots <- data.frame(
  x = numeric(),
  y = numeric(),
  cluster = factor()
)

# Enable CORS for Frontend
#* @filter cors
function(req, res) {
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

#* Add Dots
#* @post /api/dots
function(req, res) {
  body <- jsonlite::fromJSON(req$postBody)
  new_points <- data.frame(
    x = as.numeric(body$x),
    y = as.numeric(body$y),
    cluster = as.factor(body$cluster)
  )
  user_dots <<- rbind(user_dots, new_points)
  res$status <- 201
  return(list(message = "Points added", total = nrow(user_dots)))
}

#* Get Dots
#* @get /api/dots
function() {
  return(user_dots)
}

#* Clear Data
#* @delete /api/dots
function() {
  user_dots <<- data.frame(x = numeric(), y = numeric(), cluster = factor())
  return(list(message = "Cleared"))
}

#* Predict KNN
#* @post /api/predict-knn
function(req, res, k = 3) {
  k <- as.integer(k)
  if (nrow(user_dots) < k) {
    res$status <- 400
    return(list(error = "Not enough data points added yet!"))
  }
  body <- jsonlite::fromJSON(req$postBody)
  
  train_matrix <- user_dots[, c("x", "y")]
  train_labels <- user_dots$cluster
  test_matrix  <- body[, c("x", "y")]
  
  predictions <- class::knn(train = train_matrix, test = test_matrix, cl = train_labels, k = k)
  
  results <- cbind(test_matrix, predicted_cluster = as.character(predictions))
  return(results)
}