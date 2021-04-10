const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };
  
 

module.exports.index = async (req, res) => {
    let count=0;
  
    if(req.query.search) {

        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
       // Campground.find({$or: [{name: regex}, {location: regex}]}, function(err, alldestinations)
        Campground.find({$or: [{title: regex}, {location: regex}]}, function(err, alldestinations){
           if(err){
               console.log(err);
           } else {
              if(alldestinations.length < 1) {
                req.flash('error','No match , Please try again')
                res.redirect(`/blogs`)
                 // noMatch = "No campgrounds match that query, please try again.";
              }
             console.log(alldestinations);
               count= alldestinations.length;
               // req.flash('success',count +" destinations found");
              res.render("blogs/index",{campgrounds:alldestinations,count:count});

           }
        });
    } 
   
    else{
    const campgrounds = await Campground.find({});
    res.render('blogs/index', { campgrounds:campgrounds ,count:count})}
}

module.exports.renderNewForm = (req, res) => {
    res.render('blogs/new');
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;
    await campground.save();
    console.log(campground);
    req.flash('success', 'Successfully made a new campground!');
    res.redirect(`/blogs/${campground._id}`)
}

module.exports.showCampground = async (req, res,) => {
    const campground = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author').populate("comments likes");
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/blogs');
    }
    res.render('blogs/show', { campground });
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id)
    if (!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/blogs');
    }
    res.render('blogs/edit', { campground });
}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);
    await campground.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Successfully updated campground!');
    res.redirect(`/blogs/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/blogs');
}