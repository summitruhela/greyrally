(function () {
  'use strict';
  window.addEventListener('load', function () {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var auctionForm = document.getElementById('createAuction');
    // Loop over them and prevent submission
    auctionForm.addEventListener('submit', function (event) {

      // Get values from form
      var auctionName = document.getElementById('auctionTitle').value;
      var auctionDesc = document.getElementById('auctionDescription').value;
      var auctionUseCase = document.getElementById('auctionUseCase').value;
      var auctionMinBid = document.getElementById('auctionMinimumBid').value;
      var auctionBuyOut = document.getElementById('auctionBuyOut').value;
      var auctionUpload = document.getElementById('auctionUpload');

      // Pass values into function to verify
      var isAuctionAvail = checkAuctionAvailability(auctionName);
      var isDescValid = descriptionValidation(auctionDesc);
      var isUseCaseValid = usecaseValidation(auctionUseCase);
      var isMinBidValid = minbidValidation(auctionMinBid, auctionBuyOut);
      var isUploadValid = fileUploadValidation(auctionUpload);

      if (!isAuctionAvail) {
        event.preventDefault();
        event.stopPropagation();

        if (document.getElementById('auctionTitle').classList.contains('is-valid')) {
          document.getElementById('auctionTitle').classList.remove('is-valid')
          document.getElementById('auctionTitle').classList.add('is-invalid');
        } else {
          document.getElementById('auctionTitle').classList.add('is-invalid');
        }
      } else {
        if (document.getElementById('auctionTitle').classList.contains('is-invalid')) {
          document.getElementById('auctionTitle').classList.remove('is-invalid')
          document.getElementById('auctionTitle').classList.add('is-valid');
        } else {
          document.getElementById('auctionTitle').classList.add('is-valid');
        }
      }
      if (isDescValid == false) {
        event.preventDefault();
        event.stopPropagation();

        if (document.getElementById('auctionDescription').classList.contains('is-valid')) {
          document.getElementById('auctionDescription').classList.remove('is-valid')
          document.getElementById('auctionDescription').classList.add('is-invalid');
        } else {
          document.getElementById('auctionDescription').classList.add('is-invalid');
        }
      } else {
        if (document.getElementById('auctionDescription').classList.contains('is-invalid')) {
          document.getElementById('auctionDescription').classList.remove('is-invalid')
          document.getElementById('auctionDescription').classList.add('is-valid');
        } else {
          document.getElementById('auctionDescription').classList.add('is-valid');
        }
      }

      if (!isUseCaseValid) {
        event.preventDefault();
        event.stopPropagation();

        if (document.getElementById('auctionUseCase').classList.contains('is-valid')) {
          document.getElementById('auctionUseCase').classList.remove('is-valid')
          document.getElementById('auctionUseCase').classList.add('is-invalid');
        } else {
          document.getElementById('auctionUseCase').classList.add('is-invalid');
        }
      } else {
        if (document.getElementById('auctionUseCase').classList.contains('is-invalid')) {
          document.getElementById('auctionUseCase').classList.remove('is-invalid')
          document.getElementById('auctionUseCase').classList.add('is-valid');
        } else {
          document.getElementById('auctionUseCase').classList.add('is-valid');
        }
      }

      if (!isMinBidValid) {
        event.preventDefault();
        event.stopPropagation();

        if (document.getElementById('auctionMinimumBid').classList.contains('is-valid')) {
          document.getElementById('auctionMinimumBid').classList.remove('is-valid')
          document.getElementById('auctionMinimumBid').classList.add('is-invalid');
        } else {
          document.getElementById('auctionMinimumBid').classList.add('is-invalid');
        }
      } else {
        if (document.getElementById('auctionMinimumBid').classList.contains('is-invalid')) {
          document.getElementById('auctionMinimumBid').classList.remove('is-invalid')
          document.getElementById('auctionMinimumBid').classList.add('is-valid');
        } else {
          document.getElementById('auctionMinimumBid').classList.add('is-valid');
        }
      }

      if (!isUploadValid) {
        event.preventDefault();
        event.stopPropagation();

        if (document.getElementById('auctionUpload').classList.contains('is-valid')) {
          document.getElementById('auctionUpload').classList.remove('is-valid')
          document.getElementById('auctionUpload').classList.add('is-invalid');
        } else {
          document.getElementById('auctionUpload').classList.add('is-invalid');
        }
      } else {
        if (document.getElementById('auctionUpload').classList.contains('is-invalid')) {
          document.getElementById('auctionUpload').classList.remove('is-invalid')
          document.getElementById('auctionUpload').classList.add('is-valid');
        } else {
          document.getElementById('auctionUpload').classList.add('is-valid');
        }
      }

      if (isAuctionAvail && isDescValid && isUseCaseValid && isMinBidValid && isUploadValid) {
        auctionForm.classList.add('was-validated');
        submitAuction(auctionName, auctionDesc, auctionUseCase, auctionMinBid, auctionBuyOut, auctionUpload);
      }
      
      
    }, false);
  }, false);
})();

document.getElementById('auctionTitle').addEventListener("click", function(){
  if(document.getElementById('auctionTitle').classList.contains('is-invalid')){
    document.getElementById('auctionTitle').classList.remove('is-invalid');
  }
});

document.getElementById('auctionDescription').addEventListener("click", function(){
  if(document.getElementById('auctionDescription').classList.contains('is-invalid')){
    document.getElementById('auctionDescription').classList.remove('is-invalid');
  }
});

document.getElementById('auctionUseCase').addEventListener("click", function(){
  if(document.getElementById('auctionUseCase').classList.contains('is-invalid')){
    document.getElementById('auctionUseCase').classList.remove('is-invalid');
  }
});

document.getElementById('auctionOperatingSystem').addEventListener("click", function(){
  if(document.getElementById('auctionOperatingSystem').classList.contains('is-invalid')){
    document.getElementById('auctionOperatingSystem').classList.remove('is-invalid');
  }
});

document.getElementById('auctionManufacturer').addEventListener("click", function(){
  if(document.getElementById('auctionManufacturer').classList.contains('is-invalid')){
    document.getElementById('auctionManufacturer').classList.remove('is-invalid');
  }
});

document.getElementById('auctionDuration').addEventListener("click", function(){
  if(document.getElementById('auctionDuration').classList.contains('is-invalid')){
    document.getElementById('auctionDuration').classList.remove('is-invalid');
  }
});

document.getElementById('auctionType').addEventListener("click", function(){
  if(document.getElementById('auctionType').classList.contains('is-invalid')){
    document.getElementById('auctionType').classList.remove('is-invalid');
  }
});

document.getElementById('auctionUpload').addEventListener("click", function(){
  if(document.getElementById('auctionUpload').classList.contains('is-invalid')){
    document.getElementById('auctionUpload').classList.remove('is-invalid');
  }
});

document.getElementById('auctionMinimumBid').addEventListener("click", function(){
  if(document.getElementById('auctionMinimumBid').classList.contains('is-invalid')){
    document.getElementById('auctionMinimumBid').classList.remove('is-invalid');
  }
});

document.getElementById('userPin').addEventListener("click", function(){
  if(document.getElementById('userPin').classList.contains('is-invalid')){
    document.getElementById('userPin').classList.remove('is-invalid');
  }
});

function checkAuctionAvailability(auctionName) {
  if (auctionName !== "" && auctionName.match(/^[\w\-\s]+$/i) == null) {
    document.getElementById('titleError').innerHTML = "Alphanumeric characters only.";
    return false;
  } else if(auctionName == "") {
    document.getElementById('titleError').innerHTML = "Auction name cannot be empty.";
    return false;
  } else {
    return true;
  }
}


function descriptionValidation(auctionDesc) {
  if (auctionDesc === "") {
    document.getElementById('descriptionError').innerHTML = "Description cannot be empty.";
    return false;
  } else if (auctionDesc.match(/^[\w\-\s]+$/i) == null) {
    document.getElementById('descriptionError').innerHTML = "Alphanumeric characters only.";
    return false;
  } else {
    return true;
  }

}


function usecaseValidation(auctionUseCase) {

  if (auctionUseCase === "") {
    document.getElementById('useCaseError').innerHTML = "Auction case cannot be empty.";
    return false;
  } else if (auctionUseCase.match(/^[\w\-\s]+$/i) == null) {
    document.getElementById('useCaseError').innerHTML = "Alphanumeric characters only.";
    return false;
  } else {
    return true;
  }
}


function minbidValidation(auctionMinBid, auctionBuyOut) {
  if (auctionMinBid == "" || auctionMinBid == 0) {
    document.getElementById('minimumBidError').innerHTML = "Minimum bid must be greater than 0.";
    return false;
  } else if (auctionBuyOut > 0 && auctionBuyOut < auctionMinBid) {
    document.getElementById('minimumBidError').innerHTML = "Minimum bid must be less than your buyout price.";
    return false;
  } else {
    return true;
  }
}

function fileUploadValidation(auctionUpload) {
  if (auctionUpload.files.length == 0) {
    document.getElementById('uploadError').innerHTML = "Please upload a file.";
    return false;
  } else {
    return true;
  }
}


function submitAuction(auctionName, auctionDesc, auctionUseCase, auctionMinBid, auctionBuyOut, auctionUpload) {
  var data = {
    auctionName: auctionName,
    auctionDesc: auctionDesc,
    auctionUseCase: auctionUseCase,
    auctionMinBid: auctionMinBid,
    auctionBuyOut: auctionBuyOut,
    auctionUpload: auctionUpload
  };
  return fetch('/create-auction', {
      method: 'POST', // or 'PUT'
      body: JSON.stringify(data), // data can be `string` or {object}!
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
      }
    }).then((res) => {
      return res.json();
    })
    .then((json) => {
      console.log("JSON: ", json);
    })
    .catch(error => console.error('Error:', error))
}

const auctionDurationInput =  document.getElementById('auctionDuration');
const auctionMinimumBidInput = document.getElementById('auctionMinimumBid');
const auctionBuyOutInput = document.getElementById('auctionBuyOut');

auctionDurationInput.addEventListener("keydown", function (e) {
  if (e.key == 'e' || e.key == '.' || e.key == '-' || e.keyCode == 69) {
    e.preventDefault();
  }
});

auctionMinimumBidInput.addEventListener("keydown", function (e) {
  if (e.key == 'e' || e.key == '-' || e.keyCode == 69) {
    e.preventDefault();
  }
});

auctionBuyOutInput.addEventListener("keydown", function (e) {
  if (e.key == 'e' || e.key == '-' || e.keyCode == 69) {
    e.preventDefault();
  }
});