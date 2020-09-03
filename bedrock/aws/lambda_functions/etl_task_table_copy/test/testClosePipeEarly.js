
        setTimeout(function() {
            from_stream.destroy() // TEST CLOSE PIPE EARLY
          }, 3000)