// Photo Order Data Models

class PhotoOrderModel {
  int? requestID;
  String? requestCode;
  int? userID;
  String? imageStoragePath;
  String? customerNotes;
  /// The list the customer typed (with or without a photo).
  String? typedItems;
  String? requestStatus;
  int? adminReviewerID;
  String? adminNotes;
  double? subTotal;
  double? deliveryCharges;
  double? discount;
  double? grandTotal;
  int? deliveryAddressID;
  String? deliveryAddressSnapshot;
  String? paymentMethod;
  int? createdOrderID;
  String? createdAt;
  String? updatedAt;
  String? proposedAt;
  int? itemCount;
  List<PhotoOrderItemModel>? items;
  List<PhotoOrderTimelineModel>? timeline;

  PhotoOrderModel({
    this.requestID,
    this.requestCode,
    this.userID,
    this.imageStoragePath,
    this.customerNotes,
    this.typedItems,
    this.requestStatus,
    this.adminReviewerID,
    this.adminNotes,
    this.subTotal,
    this.deliveryCharges,
    this.discount,
    this.grandTotal,
    this.deliveryAddressID,
    this.deliveryAddressSnapshot,
    this.paymentMethod,
    this.createdOrderID,
    this.createdAt,
    this.updatedAt,
    this.proposedAt,
    this.itemCount,
    this.items,
    this.timeline,
  });

  factory PhotoOrderModel.fromJson(Map<String, dynamic> json) {
    var rawItems = json['Items'] ?? json['items'];
    var rawTimeline = json['Timeline'] ?? json['timeline'];

    List<PhotoOrderItemModel>? parsedItems;
    if (rawItems != null && rawItems is List) {
      parsedItems = rawItems.map((i) => PhotoOrderItemModel.fromJson(i)).toList();
    }

    List<PhotoOrderTimelineModel>? parsedTimeline;
    if (rawTimeline != null && rawTimeline is List) {
      parsedTimeline = rawTimeline.map((t) => PhotoOrderTimelineModel.fromJson(t)).toList();
    }

    return PhotoOrderModel(
      requestID: json['RequestID'] ?? json['requestID'],
      requestCode: json['RequestCode'] ?? json['requestCode'] ?? '',
      userID: json['UserID'] ?? json['userID'],
      imageStoragePath: json['ImageStoragePath'] ?? json['imageStoragePath'] ?? '',
      customerNotes: json['CustomerNotes'] ?? json['customerNotes'] ?? '',
      typedItems: json['TypedItems'] ?? '',
      requestStatus: json['RequestStatus'] ?? json['requestStatus'] ?? 'PENDING',
      adminReviewerID: json['AdminReviewerID'] ?? json['adminReviewerID'],
      adminNotes: json['AdminNotes'] ?? json['adminNotes'] ?? '',
      subTotal: double.tryParse((json['SubTotal'] ?? 0).toString()) ?? 0.0,
      deliveryCharges: double.tryParse((json['DeliveryCharges'] ?? 0).toString()) ?? 0.0,
      discount: double.tryParse((json['Discount'] ?? 0).toString()) ?? 0.0,
      grandTotal: double.tryParse((json['GrandTotal'] ?? 0).toString()) ?? 0.0,
      deliveryAddressID: json['DeliveryAddressID'] ?? json['deliveryAddressID'],
      deliveryAddressSnapshot: json['DeliveryAddressSnapshot'] ?? json['deliveryAddressSnapshot'] ?? '',
      paymentMethod: json['PaymentMethod'] ?? json['paymentMethod'] ?? 'COD',
      createdOrderID: json['CreatedOrderID'] ?? json['createdOrderID'],
      createdAt: json['CreatedAt'] ?? json['createdAt'] ?? '',
      updatedAt: json['UpdatedAt'] ?? json['updatedAt'] ?? '',
      proposedAt: json['ProposedAt'] ?? json['proposedAt'] ?? '',
      itemCount: json['ItemCount'] ?? json['itemCount'] ?? 0,
      items: parsedItems,
      timeline: parsedTimeline,
    );
  }
}

class PhotoOrderItemModel {
  int? photoOrderItemID;
  int? requestID;
  int? productID;
  int? variantID;
  String? productName;
  int? quantity;
  double? unitPrice;
  double? lineTotal;
  String? availabilityStatus;
  int? alternativeProductID;
  String? alternativeProductName;
  String? adminNotes;
  String? metrictype;
  String? metricvalue;
  int? currentStock;

  PhotoOrderItemModel({
    this.photoOrderItemID,
    this.requestID,
    this.productID,
    this.variantID,
    this.productName,
    this.quantity,
    this.unitPrice,
    this.lineTotal,
    this.availabilityStatus,
    this.alternativeProductID,
    this.alternativeProductName,
    this.adminNotes,
    this.metrictype,
    this.metricvalue,
    this.currentStock,
  });

  factory PhotoOrderItemModel.fromJson(Map<String, dynamic> json) {
    return PhotoOrderItemModel(
      photoOrderItemID: json['PhotoOrderItemID'] ?? json['photoOrderItemID'],
      requestID: json['RequestID'] ?? json['requestID'],
      productID: json['ProductID'] ?? json['productID'],
      variantID: json['VariantID'] ?? json['variantID'],
      productName: json['ProductName'] ?? json['productName'] ?? '',
      quantity: json['Quantity'] ?? json['quantity'] ?? 1,
      unitPrice: double.tryParse((json['UnitPrice'] ?? 0).toString()) ?? 0.0,
      lineTotal: double.tryParse((json['LineTotal'] ?? 0).toString()) ?? 0.0,
      availabilityStatus: json['AvailabilityStatus'] ?? json['availabilityStatus'] ?? 'AVAILABLE',
      alternativeProductID: json['AlternativeProductID'] ?? json['alternativeProductID'],
      alternativeProductName: json['AlternativeProductName'] ?? json['alternativeProductName'] ?? '',
      adminNotes: json['AdminNotes'] ?? json['adminNotes'] ?? '',
      metrictype: json['metrictype'] ?? '',
      metricvalue: json['metricvalue']?.toString() ?? '',
      currentStock: json['CurrentStock'] ?? json['currentStock'] ?? 0,
    );
  }
}

class PhotoOrderTimelineModel {
  int? timelineID;
  int? requestID;
  String? previousStatus;
  String? newStatus;
  String? changedByRole;
  int? changedByID;
  String? notes;
  String? createdAt;

  PhotoOrderTimelineModel({
    this.timelineID,
    this.requestID,
    this.previousStatus,
    this.newStatus,
    this.changedByRole,
    this.changedByID,
    this.notes,
    this.createdAt,
  });

  factory PhotoOrderTimelineModel.fromJson(Map<String, dynamic> json) {
    return PhotoOrderTimelineModel(
      timelineID: json['TimelineID'] ?? json['timelineID'],
      requestID: json['RequestID'] ?? json['requestID'],
      previousStatus: json['PreviousStatus'] ?? json['previousStatus'] ?? '',
      newStatus: json['NewStatus'] ?? json['newStatus'] ?? '',
      changedByRole: json['ChangedByRole'] ?? json['changedByRole'] ?? '',
      changedByID: json['ChangedByID'] ?? json['changedByID'],
      notes: json['Notes'] ?? json['notes'] ?? '',
      createdAt: json['CreatedAt'] ?? json['createdAt'] ?? '',
    );
  }
}
